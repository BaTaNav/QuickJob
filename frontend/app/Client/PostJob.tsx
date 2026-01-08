import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
  StatusBar,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  SafeAreaView,
  LayoutAnimation,
  UIManager,
  Image,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,

  AlertCircle,
  Briefcase,
  Scissors,
  Wrench,
  Truck,
  Home,
  ChevronRight,
  MapPin,
  DollarSign,
  Dog,
} from "lucide-react-native";
import { getClientId, jobsAPI } from "@/services/api";
import * as ImagePicker from 'expo-image-picker';



// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Conditional import for DateTimePicker
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  try {
    DateTimePicker = require("@react-native-community/datetimepicker").default;
  } catch (e) {
    console.warn("DateTimePicker not available");
  }
}

// --- Constants & Config ---

const JOB_CATEGORIES = [
  { id: 1, key: "cleaning", icon: Home, name_nl: "Schoonmaak", name_fr: "Nettoyage", name_en: "Cleaning" },
  { id: 2, key: "garden", icon: Scissors, name_nl: "Tuinwerk", name_fr: "Jardinage", name_en: "Gardening" },
  { id: 3, key: "repair", icon: Wrench, name_nl: "Reparatie", name_fr: "Réparation", name_en: "Repair" },
  { id: 4, key: "moving", icon: Truck, name_nl: "Verhuizing", name_fr: "Déménagement", name_en: "Moving" },
  { id: 5, key: "handyman", icon: Briefcase, name_nl: "Klusjeswerk", name_fr: "Bricolage", name_en: "Handyman" },
  { id: 6, key: "petcare", icon: Dog, name_nl: "Dierenverzorging", name_fr: "Soins pour animaux", name_en: "Pet care" },
];

const TITLE_SUGGESTIONS: Record<string, string[]> = {
  cleaning: ["Huis schoonmaak", "Ramen wassen", "Diepte schoonmaak", "Strijken"],
  garden: ["Gras maaien", "Struiken snoeien", "Onkruid verwijderen", "Bladeren ruimen"],
  repair: ["Lekkage repareren", "Elektra herstellen", "Deur reparatie", "Verstopping"],
  moving: ["Hulp bij inpakken", "Meubels verplaatsen", "Volledige verhuizing", "Vervoer"],
  handyman: ["Kader ophangen", "IKEA meubel", "Lamp vervangen", "Kleine klusjes"],
};

const DESCRIPTION_TEMPLATES = [
  "Wat moet er gebeuren?",
  "Benodigdheden aanwezig?",
  "Specifiek adres/parking?",
  "Zijn er huisdieren?",
];

const FIXED_PRICE_PRESETS = [25, 50, 75, 100, 150, 200];
const DURATION_PRESETS = [2, 3, 4, 5, 6, 8];

// --- Types ---

interface JobFormData {
  client_id: string;
  category_id: number | null;
  title: string;
  description: string;
  // Structured address fields (new)
  street?: string;
  house_number?: string;
  postal_code?: string;
  city?: string;
  hourly_or_fixed: "hourly" | "fixed";
  hourly_rate: number | null;
  fixed_price: number | null;
  start_time: Date;
  end_time: Date | null;
  duration: number | null;
  urgent: boolean;
}

// --- Main Component ---

export default function PostJob() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  // Format helpers for inputs
  const formatDateForInput = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const formatTimeForInput = (d: Date) => {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  // Small helper to ensure we have a valid Date object
  const formFormDataStartSafe = (d: Date | null) => d ? new Date(d) : new Date();

  // State
  const [clientId, setClientId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [language, setLanguage] = useState<"nl" | "fr" | "en">("nl");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // ... existing state ...
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);


  // --- PASTE THIS BLOCK INSIDE THE COMPONENT ---


  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };
  // ---------------------------------------------

  // Native Pickers State
  const [pickerMode, setPickerMode] = useState<"date" | "startTime" | "endTime" | null>(null);

  // Web Modal State (coords will be used to position modal near the trigger on web)
  const [webModal, setWebModal] = React.useState<null | { mode: 'date' | 'time'; target: 'date' | 'start' | 'end'; value: string; coords?: { top: number; left: number; width?: number } }>(null);
  const webModalInputRef = React.useRef<any>(null);

  // Refs to anchor the popup to the DOM nodes on web
  const dateSelectorRef = React.useRef<any>(null);
  const startTimeRef = React.useRef<any>(null);
  const endTimeRef = React.useRef<any>(null);

  // Open Web Modal (Positioning logic attempts to anchor to the trigger on web)
  const openWebModal = (mode: 'date' | 'time', target: 'date' | 'start' | 'end', initialDate: Date | null) => {
    const value = mode === 'date' ? formatDateForInput(initialDate || new Date()) : formatTimeForInput(initialDate || new Date());

    if (Platform.OS === 'web') {
      try {
        let el: any = null;
        if (target === 'date') el = dateSelectorRef.current;
        else if (target === 'start') el = startTimeRef.current;
        else el = endTimeRef.current;

        // Compute a single, consistent centered position for all pickers
        // so they appear in the same place (slightly above center of viewport).
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const cardHeight = 280; 

        // Try to use the trigger width as a hint for card width, but fall back to a sensible viewport fraction
        let preferredCardWidth = Math.min(520, Math.floor((el && typeof el.getBoundingClientRect === 'function') ? (el.getBoundingClientRect().width || viewportWidth * 0.6) : viewportWidth * 0.6));
        preferredCardWidth = Math.max(300, Math.min(preferredCardWidth, Math.floor(viewportWidth * 0.9)));

        // Slightly above center (pull up 6% of viewport) so it doesn't overlap header or sidebar
        const verticalOffset = Math.floor(viewportHeight * 0.06);
        let top = Math.floor((viewportHeight - cardHeight) / 2) - verticalOffset;
        top = Math.max(8, Math.min(top, viewportHeight - cardHeight - 8));

        // Shift left on desktop so modal aligns more with the main content (not the right sidebar)
        const leftShift = (typeof isDesktop !== 'undefined' && isDesktop) ? Math.floor(350 / 2) : 0; // half of sidebar width
        let left = Math.floor((viewportWidth - preferredCardWidth) / 2) - leftShift;
        left = Math.max(8, Math.min(left, viewportWidth - preferredCardWidth - 8));

        setWebModal({ mode, target, value, coords: { top, left, width: preferredCardWidth } });
        return;
      } catch (err) {
        // Fall back to centered modal if anything fails
        console.warn('Could not compute anchor for web modal', err);
      }
    }

    // Default (centered) behavior
    setWebModal({ mode, target, value });
  };

  const confirmWebModal = () => {
    if (!webModal) return;

    if (webModal.mode === 'date') {
      const [y, m, d] = webModal.value.split('-').map(Number);
      const newStart = new Date(formData.start_time);
      newStart.setFullYear(y, m - 1, d);
      setFormData(p => ({ ...p, start_time: newStart }));
    } else {
      // Time Logic
      const [hh, mm] = webModal.value.split(':').map(Number);

      if (webModal.target === 'start') {
        const newStart = new Date(formData.start_time);
        newStart.setHours(hh, mm);
        setFormData(p => ({ ...p, start_time: newStart }));
      } else if (webModal.target === 'end') {
        const newEnd = new Date(formFormDataStartSafe(formData.start_time));
        newEnd.setHours(hh, mm);

        // Validation: End time must be after start time
        if (newEnd <= formFormDataStartSafe(formData.start_time)) {
          if (Platform.OS === 'web') alert('Eindtijd moet na de starttijd liggen.');
          else Alert.alert('Fout', 'Eindtijd moet na de starttijd liggen.');
          return;
        }
        setFormData(p => ({ ...p, end_time: newEnd, duration: null })); // Reset duration if end time is set manually
      }
    }
    setWebModal(null);
  };

  const cancelWebModal = () => setWebModal(null);

  // Auto-focus + keyboard handling for modal
  React.useEffect(() => {
    if (!webModal) return;
    // Small timeout to allow render
    setTimeout(() => webModalInputRef.current?.focus?.(), 50);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelWebModal();
      if (e.key === 'Enter') confirmWebModal();
    };

    if (Platform.OS === 'web') {
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [webModal]);

  const [formData, setFormData] = useState<JobFormData>({
    client_id: "",
    category_id: null,
    title: "",
    description: "",
  // new structured address defaults
  street: "",
  house_number: "",
  postal_code: "",
  city: "",
    hourly_or_fixed: "hourly",
    hourly_rate: null,
    fixed_price: null,
    start_time: new Date(),
    end_time: null,
    duration: null,
    urgent: false,
  });


  // Address validation errors
  const [addressErrors, setAddressErrors] = useState<{ street?: string; house_number?: string; postal_code?: string; city?: string }>({});

  // Initialization
  useEffect(() => {
    if (Platform.OS === "web") document.title = "QuickJob | Post a Job";

    (async () => {
      const stored = await getClientId();
      if (stored) {
        setClientId(stored);
        setFormData(prev => ({ ...prev, client_id: stored }));
      } else {
        setError("Geen client sessie gevonden. Log opnieuw in.");
      }
    })();
  }, []);

  // --- Handlers ---

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentStep(curr => curr + 1);
      scrollToTop();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentStep(curr => curr - 1);
      scrollToTop();
    }
  };

  const onDateTimeChange = (event: any, selectedDate?: Date) => {
    const mode = pickerMode;
    setPickerMode(null);

    if (event.type === 'dismissed' || !selectedDate) return;

    if (mode === 'date') {
      const newStart = new Date(formData.start_time);
      newStart.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setFormData(prev => ({ ...prev, start_time: newStart }));
    } else if (mode === 'startTime') {
      const newStart = new Date(formData.start_time);
      newStart.setHours(selectedDate.getHours(), selectedDate.getMinutes());
      setFormData(prev => ({ ...prev, start_time: newStart }));
    } else if (mode === 'endTime') {
      const newEnd = new Date(formData.start_time);
      newEnd.setHours(selectedDate.getHours(), selectedDate.getMinutes());
      if (newEnd <= formData.start_time) {
        Alert.alert("Ongeldige tijd", "Eindtijd moet na de starttijd liggen.");
        return;
      }
      setFormData(prev => ({ ...prev, end_time: newEnd, duration: null }));
    }
  };

  const handleSetDuration = (hours: number) => {
    setFormData(prev => ({ ...prev, duration: hours, end_time: null }));
  };

  const handleAddTemplate = (text: string) => {
    setFormData(prev => ({
      ...prev,
      description: prev.description ? `${prev.description}\n- ${text}` : `- ${text}`
    }));
  };

  // Validation
  // Require full structured address (street, house_number, 4-digit postal_code, city) as part of step 1
  const validateAddressFields = (data: JobFormData) => {
    if (!data.street || data.street.trim().length < 2) return false;
    if (!data.house_number || data.house_number.trim().length < 1) return false;
    if (!data.postal_code || !/^\d{4}$/.test(String(data.postal_code).trim())) return false;
    if (!data.city || data.city.trim().length < 2) return false;
    return true;
  };

  const composeAddress = (data: JobFormData) => {
    const parts: string[] = [];
    if (data.street) {
      let s = data.street.trim();
      if (data.house_number) s += ` ${data.house_number.trim()}`;
      parts.push(s);
    }
    if (data.postal_code) parts.push(String(data.postal_code).trim());
    if (data.city) parts.push(data.city.trim());
    return parts.length > 0 ? parts.join(' ') : '';
  };

  // Lightweight address parser: attempts to extract street, house_number, postal_code, city from a single input
  // No single-line full-address input: users fill street, house_number, postal_code and city separately.

  const isStep1Valid = !!formData.category_id && formData.title.trim().length > 3 && validateAddressFields(formData);
  const isStep2Valid = true;
  const isStep3Valid = (formData.hourly_or_fixed === "fixed" ? (formData.fixed_price || 0) > 0 : (formData.duration || 0) > 0);

  const getStepValidity = () => {
    if (currentStep === 1) return isStep1Valid;
    if (currentStep === 2) return isStep2Valid;
    if (currentStep === 3) return isStep3Valid;
    return true;
  };

  // Add this constant at the TOP of your file (outside the component) if not already there
  const API_URL = 'http://localhost:3000'; // Use your computer's IP if on real device

  // ... imports remain the same


  const handlePostJob = async () => {
    // 1. Validation
    if (!formData.client_id) {
      Alert.alert("Error", "Sessie verlopen. Log opnieuw in.");
      return;
    }
    if (!formData.title || !formData.category_id || !formData.start_time) {
      Alert.alert("Error", "Vul alle verplichte velden in.");
      return;
    }
    // Validate structured address before attempting to post
    const validateAddress = () => {
      const errs: any = {};
      if (!formData.street || formData.street.trim().length < 2) errs.street = 'Straat is verplicht';
      if (!formData.house_number || formData.house_number.trim().length < 1) errs.house_number = 'Huisnummer is verplicht';
      if (!formData.postal_code || !/^\d{4}$/.test(String(formData.postal_code).trim())) errs.postal_code = 'Ongeldige postcode (4 cijfers)';
      if (!formData.city || formData.city.trim().length < 2) errs.city = 'Gemeente is verplicht';
      setAddressErrors(errs);
      return Object.keys(errs).length === 0;
    };

    if (!validateAddress()) {
      setError('Controleer het adresformulier.');
      return;
    }

    setUploading(true);
    let uploadedImageUrl = null;

    try {
      // 2. Image Upload Logic (Handles both Web and Mobile)
      if (image) {
        const uploadBody = new FormData();
        const filename = image.split('/').pop() || 'upload.jpg';

        if (Platform.OS === 'web') {
          // --- WEB SPECIFIC LOGIC ---
          // On web, we must fetch the URI and convert to a Blob
          const response = await fetch(image);
          const blob = await response.blob();
          uploadBody.append('image', blob, filename);
        } else {
          // --- MOBILE SPECIFIC LOGIC ---
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;

          // @ts-ignore
          uploadBody.append('image', {
            uri: image,
            name: filename,
            type,
          });
        }

        // Upload to backend
        const uploadUrl = `${API_URL}/jobs/upload-image`;
        console.log('Uploading image to', uploadUrl);
        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          body: uploadBody,
          // IMPORTANT: Do NOT set Content-Type header manually here
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Image upload failed");
        }

        if (uploadData.url) {
          uploadedImageUrl = uploadData.url;
        }
      }

      // 3. Prepare Job Payload
      let finalEndTime = formData.end_time;
      if (!finalEndTime && formData.duration) {
        finalEndTime = new Date(formData.start_time);
        finalEndTime.setHours(finalEndTime.getHours() + formData.duration);
      } else if (!finalEndTime) {
        finalEndTime = new Date(formData.start_time);
        finalEndTime.setHours(finalEndTime.getHours() + 2);
      }

  const payload = {
        client_id: formData.client_id,
        category_id: formData.category_id!,
        title: formData.title,
        description: formData.description || undefined,
  // Structured address fields (Belgium-only)
  street: formData.street || undefined,
  house_number: formData.house_number || undefined,
  postal_code: formData.postal_code || undefined,
  city: formData.city || undefined,
        hourly_or_fixed: formData.hourly_or_fixed,
        hourly_rate: formData.hourly_rate,
        fixed_price: formData.fixed_price,
        start_time: formData.start_time.toISOString(),
        end_time: finalEndTime?.toISOString(),
        image_url: uploadedImageUrl,
      };

      // 4. Send Job to Backend
      await jobsAPI.createJob(payload);

      Alert.alert("Success", "Job posted successfully!");
      router.replace("/Client/DashboardClient" as never);

    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Er ging iets mis.");
    } finally {
      setUploading(false);
      setLoading(false);
    }
  };

  // --- Render Helpers ---

  const getCategoryDetails = (id: number | null) => JOB_CATEGORIES.find(c => c.id === id);

  const renderProgressBar = () => (
    <View style={styles.progressContainer} accessible={false}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.progressSegment}>
          <View style={[
            styles.progressBar,
            step <= currentStep ? styles.progressBarActive : styles.progressBarInactive
          ]} />
        </View>
      ))}
    </View>
  );

  const screenWidth = Dimensions.get("window").width;
  const isDesktop = screenWidth > 768;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* --- Header --- */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Ga terug"
        >
          <ArrowLeft size={24} color="#1a2e4c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">Job Plaatsen</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderProgressBar()}

      {error ? (
        <TouchableOpacity onPress={() => setError("")} style={styles.errorBanner} accessibilityRole="alert">
          <AlertCircle size={16} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </TouchableOpacity>
      ) : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={isDesktop ? styles.desktopContainer : styles.mobileContainer}>

          {/* --- Main Form Area --- */}
          <ScrollView
            ref={scrollRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {currentStep === 1 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Wat voor klus is het?</Text>

                {/* Category Grid */}
                <View style={styles.gridContainer} accessibilityRole="radiogroup">
                  {JOB_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = formData.category_id === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.gridItem, isSelected && styles.gridItemActive]}
                        onPress={() => setFormData(prev => ({ ...prev, category_id: cat.id, title: "" }))}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={(cat as any)[`name_${language}`]}
                      >
                        <Icon size={28} color={isSelected ? "#000000ff" : "#176B51"} />
                        <Text style={[styles.gridText, isSelected && styles.gridTextActive]}>
                          {(cat as any)[`name_${language}`]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Title Input */}
                {formData.category_id && (
                  <View style={styles.section}>
                    <Text style={styles.label}>Titel van de opdracht *</Text>

                    <View style={styles.suggestionsRow}>
                      {TITLE_SUGGESTIONS[getCategoryDetails(formData.category_id)?.key || ""]?.map((sugg, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => setFormData(prev => ({ ...prev, title: sugg }))}
                          style={styles.chip}
                          accessibilityRole="button"
                          accessibilityLabel={`Kies suggestie: ${sugg}`}
                        >
                          <Text style={styles.chipText}>{sugg}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TextInput
                      style={styles.input}
                      value={formData.title}
                      onChangeText={t => setFormData(p => ({ ...p, title: t }))}
                      placeholder="bv. Grote schoonmaak na verbouwing"
                      maxLength={60}
                      accessibilityLabel="Titel van de opdracht"
                      accessibilityHint="Vul een korte titel in"
                    />


                  </View>

                )}
                {/* Image Picker UI */}
                <View style={{ marginBottom: 20, alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={pickImage}
                    style={{
                      width: '100%',
                      height: 150,
                      backgroundColor: '#f0f0f0',
                      borderRadius: 10,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#ccc',
                      borderStyle: 'dashed'
                    }}
                  >
                    {image ? (
                      <Image source={{ uri: image }} style={{ width: '100%', height: '100%', borderRadius: 10 }} />
                    ) : (
                      <Text style={{ color: '#666' }}>+ Upload Job Photo</Text>
                    )}
                  </TouchableOpacity>

                  {image && (
                    <TouchableOpacity onPress={() => setImage(null)} style={{ marginTop: 10 }}>
                      <Text style={{ color: 'red' }}>Remove Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>


                {/* Location / Structured Address */}
                <View style={styles.section}>
                  <Text style={styles.label}>Adres</Text>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={[styles.input, { flex: 2, marginRight: 8 }]}
                      placeholder="Straat"
                      value={formData.street}
                      onChangeText={t => setFormData(p => ({ ...p, street: t }))}
                      accessibilityLabel="Straat"
                    />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Huisnr"
                      value={formData.house_number}
                      onChangeText={t => setFormData(p => ({ ...p, house_number: t }))}
                      accessibilityLabel="Huisnummer"
                    />
                  </View>
                  {addressErrors.street ? <Text style={styles.addressError}>{addressErrors.street}</Text> : null}
                  {addressErrors.house_number ? <Text style={styles.addressError}>{addressErrors.house_number}</Text> : null}

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginRight: 8 }]}
                      placeholder="Postcode"
                      keyboardType="numeric"
                      value={String(formData.postal_code || '')}
                      onChangeText={t => setFormData(p => ({ ...p, postal_code: t }))}
                      accessibilityLabel="Postcode"
                    />
                    <TextInput
                      style={[styles.input, { flex: 2 }]}
                      placeholder="Gemeente"
                      value={formData.city}
                      onChangeText={t => setFormData(p => ({ ...p, city: t }))}
                      accessibilityLabel="Gemeente"
                    />
                  </View>
                  {addressErrors.postal_code ? <Text style={styles.addressError}>{addressErrors.postal_code}</Text> : null}
                  {addressErrors.city ? <Text style={styles.addressError}>{addressErrors.city}</Text> : null}

                  {/* Country removed — Belgium only, handled server-side if needed */}

                  <View style={{ marginTop: 10 }}>
                    
                  </View>
                </View>
              </View>
            )}

            {currentStep === 2 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Wanneer?</Text>

                <View style={styles.card}>
                  <Text style={styles.label}>Datum</Text>
                  <TouchableOpacity
                    ref={dateSelectorRef}
                    style={styles.dateSelector}
                    onPress={() => {
                      if (Platform.OS === 'web') {
                        openWebModal('date', 'date', formData.start_time);
                      } else {
                        setPickerMode('date');
                      }
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Datum selecteren"
                  >
                    <Calendar size={20} color="#176B51" />
                    <Text style={styles.dateSelectorText}>
                      {formFormDataStartSafe(formData.start_time).toLocaleDateString(language === 'en' ? 'en-US' : 'nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Text>

                    <Text style={styles.changeLink}>Wijzig</Text>
                    {Platform.OS === 'web' && (
                      <TouchableOpacity onPress={() => openWebModal('date', 'date', formData.start_time)} style={{ marginLeft: 8 }}>
                        <Text style={{ color: '#176B51', fontWeight: '600' }}>Open picker</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.timeRow}>
                  <View style={[styles.card, { flex: 1 }]}>
                    <Text style={styles.label}>Starttijd</Text>
                    <TouchableOpacity
                      ref={startTimeRef}
                      style={styles.timeSelector}
                      onPress={() => {
                        if (Platform.OS === 'web') {
                          openWebModal('time', 'start', formFormDataStartSafe(formData.start_time));
                        } else {
                          setPickerMode('startTime');
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Starttijd selecteren"
                    >
                      <Text style={styles.timeBig}>
                        {formData.start_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      {Platform.OS === 'web' && (
                        <TouchableOpacity onPress={() => openWebModal('time', 'start', formFormDataStartSafe(formData.start_time))} style={{ marginTop: 6 }}>
                          <Text style={{ color: '#176B51', fontWeight: '600' }}>Open picker</Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={{ justifyContent: 'center', paddingTop: 20 }}>
                    <ArrowLeft size={20} color="#ccc" style={{ transform: [{ rotate: '180deg' }] }} />
                  </View>

                  <View style={[styles.card, { flex: 1 }]}>
                    <Text style={styles.label}>Eindtijd (optioneel)</Text>
                    <TouchableOpacity
                      ref={endTimeRef}
                      style={styles.timeSelector}
                      onPress={() => {
                        if (Platform.OS === 'web') {
                          openWebModal('time', 'end', formFormDataStartSafe(formData.end_time || formData.start_time));
                        } else {
                          setPickerMode('endTime');
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Eindtijd selecteren"
                    >
                      <Text style={[styles.timeBig, !formData.end_time && { color: '#ccc' }]}>
                        {formData.end_time
                          ? formFormDataStartSafe(formData.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : "--:--"}
                      </Text>
                      {Platform.OS === 'web' && (
                        <TouchableOpacity onPress={() => openWebModal('time', 'end', formFormDataStartSafe(formData.end_time || formData.start_time))} style={{ marginTop: 6 }}>
                          <Text style={{ color: '#176B51', fontWeight: '600' }}>Open picker</Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {!formData.end_time && (
                  <View style={styles.infoBox} accessibilityRole="alert">
                    <AlertCircle size={16} color="#1a2e4c" />
                    <Text style={styles.infoText}>Geen eindtijd? Je kunt ook een duur kiezen in de volgende stap.</Text>
                  </View>
                )}
              </View>
            )}

            {currentStep === 3 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Budget & Details</Text>

                <View style={styles.toggleContainer} accessibilityRole="radiogroup">
                  <TouchableOpacity
                    style={[styles.toggleBtn, formData.hourly_or_fixed === 'hourly' && styles.toggleBtnActive]}
                    onPress={() => setFormData(p => ({ ...p, hourly_or_fixed: 'hourly' }))}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: formData.hourly_or_fixed === 'hourly' }}
                    accessibilityLabel="Betaling per uur"
                  >
                    <Text style={[styles.toggleText, formData.hourly_or_fixed === 'hourly' && styles.toggleTextActive]}>Per Uur</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleBtn, formData.hourly_or_fixed === 'fixed' && styles.toggleBtnActive]}
                    onPress={() => setFormData(p => ({ ...p, hourly_or_fixed: 'fixed' }))}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: formData.hourly_or_fixed === 'fixed' }}
                    accessibilityLabel="Vaste prijs"
                  >
                    <Text style={[styles.toggleText, formData.hourly_or_fixed === 'fixed' && styles.toggleTextActive]}>Vaste Prijs</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.card}>
                  {formData.hourly_or_fixed === 'hourly' ? (
                    <>
                      <Text style={styles.label}>Verwachte duur (uren)</Text>
                      <View style={styles.presetsRow}>
                        {DURATION_PRESETS.map(d => (
                          <TouchableOpacity
                            key={d}
                            style={[styles.presetCircle, formData.duration === d && styles.presetCircleActive]}
                            onPress={() => handleSetDuration(d)}
                            accessibilityRole="button"
                            accessibilityLabel={`${d} uur`}
                          >
                            <Text style={[styles.presetText, formData.duration === d && styles.presetTextActive]}>{d}u</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.label}>Totaal budget (€)</Text>
                      <View style={styles.presetsRow}>
                        {FIXED_PRICE_PRESETS.map(p => (
                          <TouchableOpacity
                            key={p}
                            style={[styles.presetCircle, formData.fixed_price === p && styles.presetCircleActive]}
                            onPress={() => setFormData(pr => ({ ...pr, fixed_price: p }))}
                            accessibilityRole="button"
                            accessibilityLabel={`${p} euro`}
                          >
                            <Text style={[styles.presetText, formData.fixed_price === p && styles.presetTextActive]}>€{p}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TextInput
                        placeholder="Ander bedrag..."
                        keyboardType="numeric"
                        style={styles.input}
                        onChangeText={(t) => setFormData(p => ({ ...p, fixed_price: Number(t) }))}
                        accessibilityLabel="Ander bedrag invullen"
                      />
                    </>
                  )}
                </View>

                <View style={[styles.card, { marginTop: 16 }]}>
                  <View style={styles.rowBetween}>
                    <View>
                      <Text style={[styles.label, { marginBottom: 2 }]}>Spoed Opdracht</Text>
                      <Text style={styles.helperText}>Moet binnen 24u gebeuren (+10%)</Text>
                    </View>
                    <Switch
                      value={formData.urgent}
                      onValueChange={v => setFormData(p => ({ ...p, urgent: v }))}
                      trackColor={{ false: "#eee", true: "#176B51" }}
                      accessibilityLabel="Spoed opdracht inschakelen"
                    />
                  </View>
                </View>

                <View style={{ marginTop: 24 }}>
                  <Text style={styles.label}>Omschrijving</Text>
                  <View style={styles.suggestionsRow}>
                    {DESCRIPTION_TEMPLATES.map((t, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.chipSmall}
                        onPress={() => handleAddTemplate(t)}
                        accessibilityRole="button"
                        accessibilityLabel={`Voeg tekst toe: ${t}`}
                      >
                        <Text style={styles.chipTextSmall}>+ {t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={4}
                    placeholder="Beschrijf de taak zo duidelijk mogelijk..."
                    value={formData.description}
                    onChangeText={t => setFormData(p => ({ ...p, description: t }))}
                    accessibilityLabel="Omschrijving van de taak"
                  />
                </View>
              </View>
            )}

            {currentStep === 4 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Overzicht</Text>

                <View style={styles.summaryCard}>
                  <View style={styles.summaryHeader}>
                    <View style={styles.iconCircle}>
                      {(() => {
                        const CatIcon = getCategoryDetails(formData.category_id)?.icon || Home;
                        return <CatIcon color="#fff" size={24} />;
                      })()}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.summaryTitle}>{formData.title}</Text>
                      <Text style={styles.summarySub}>{getCategoryDetails(formData.category_id)?.name_nl}</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.summaryRow}>
                    <Calendar size={18} color="#666" />
                    <Text style={styles.summaryText}>
                      {formData.start_time.toLocaleDateString()} om {formData.start_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  
            <View style={styles.summaryRow}>
              <MapPin size={18} color="#666" />
              <Text style={styles.summaryText}>{composeAddress(formData) || "Geen locatie opgegeven"}</Text>
            </View>

                  <View style={styles.summaryRow}>
                    <DollarSign size={18} color="#666" />
                    <Text style={styles.summaryText}>
                      {formData.hourly_or_fixed === 'fixed'
                        ? `Vaste prijs: €${formData.fixed_price}`
                        : `Per uur (${formData.duration ? formData.duration + 'u' : 'Duur onbekend'})`}
                    </Text>
                  </View>

                  {formData.urgent && (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentBadgeText}>⚡ SPOED OPDRACHT</Text>
                    </View>
                  )}
                </View>

                {formData.description ? (
                  <View style={styles.card}>
                    <Text style={styles.label}>Omschrijving</Text>
                    <Text style={styles.bodyText}>{formData.description}</Text>
                  </View>
                ) : null}
              </View>


            )}

            {/* Bottom Spacer: ensures content scrolls above the footer */}
            <View style={{ height: 120 }} />

            {/* Web-centered modal for date/time pickers*/}
            {Platform.OS === 'web' && webModal && (
              <Pressable style={styles.webModalOverlay} onPress={() => cancelWebModal()}>
                <Pressable
                  style={[
                    styles.webModalCard,
                    webModal?.coords ? { position: 'absolute', top: webModal.coords.top, left: webModal.coords.left, width: webModal.coords.width } : { alignSelf: 'center', marginTop: 64 }
                  ]}
                  onPress={(e: any) => e.stopPropagation()}
                >
                  <TouchableOpacity onPress={cancelWebModal} style={{ position: 'absolute', top: 10, right: 10, padding: 6 }} accessibilityLabel="Close picker">
                    <Text style={{ fontSize: 16, color: '#6B7280' }}>✕</Text>
                  </TouchableOpacity>

                  <Text style={styles.webModalTitle}>{webModal.mode === 'date' ? 'Choose date' : `Choose time (${webModal.target === 'start' ? 'Start' : 'End'})`}</Text>

                  {webModal.mode === 'date' && (
                    <Text style={{ marginTop: 8, color: '#6B7280' }}>{(() => {
                      const parts = (webModal.value || '').split('-');
                      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
                      return webModal.value;
                    })()}</Text>
                  )}

                  <input
                    ref={webModalInputRef as any}
                    type={webModal.mode}
                    value={webModal.value}
                    onClick={(e: any) => e.stopPropagation()}
                    onChange={(e: any) => setWebModal(m => m ? ({ ...m, value: e.target.value }) : m)}
                    onKeyDown={(e: any) => { if (e.key === 'Enter') confirmWebModal(); if (e.key === 'Escape') cancelWebModal(); }}
                    style={styles.webModalInput as any}
                  />

                  {image && (
                    <Image source={{ uri: image }} style={{ width: '100%', height: 200, borderRadius: 10, marginTop: 10 }} />
                  )}

                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 18 }}>
                    <TouchableOpacity onPress={cancelWebModal} style={styles.webModalButtonSecondary}>
                      <Text style={{ color: '#374151' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={confirmWebModal} style={styles.webModalButtonPrimary}>
                      <Text style={{ color: '#fff' }}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </Pressable>

            )}

          </ScrollView>

          {/* --- Desktop Sidebar (Preview) --- */}
          {isDesktop && (
            <View style={styles.desktopSidebar}>
              <Text style={styles.sidebarTitle}>Live Preview</Text>
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>{formData.title || "Titel..."}</Text>
                <Text style={styles.previewText}>{getCategoryDetails(formData.category_id)?.name_nl || "Categorie..."}</Text>
                <View style={{ height: 8 }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MapPin size={14} color="#666" />
                  <Text style={[styles.previewText, { fontSize: 13 }]}>{composeAddress(formData) || 'Geen locatie'}</Text>
                </View>
                 <View style={styles.divider} />
                 <Text style={styles.previewPrice}>
                    {formData.hourly_or_fixed === 'fixed' 
                      ? `€${formData.fixed_price || 0}` 
                      : `~ €${(formData.duration || 0) * 20} (schatting)`}
                 </Text>
              </View>
              {/* Extra spacer in sidebar to prevent overlap if content grows */}
              <View style={{ height: 100 }} />
            </View>
          )}

          {/* --- Footer / Navigation Buttons --- */}
          <View style={styles.footer}>
            <View style={styles.footerInner}>
              {currentStep > 1 && (
                <TouchableOpacity
                  onPress={handlePrevStep}
                  style={styles.navButtonSecondary}
                  accessibilityRole="button"
                  accessibilityLabel="Ga naar vorige stap"
                >
                  <Text style={styles.navButtonTextSecondary}>Vorige</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={currentStep === 4 ? handlePostJob : handleNextStep}
                disabled={!getStepValidity() || loading}
                style={[styles.navButtonPrimary, (!getStepValidity() || loading) && styles.disabledButton]}
                accessibilityRole="button"
                accessibilityLabel={currentStep === 4 ? "Plaats job" : "Ga naar volgende stap"}
                accessibilityState={{ disabled: !getStepValidity() || loading }}
              >
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.navButtonTextPrimary}>
                      {currentStep === 4 ? "Plaats Job" : "Volgende"}
                    </Text>
                    {currentStep !== 4 && <ChevronRight size={18} color="#fff" />}
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </KeyboardAvoidingView>

      {/* --- Native Modals --- */}

    </SafeAreaView>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a2e4c",
  },
  iconButton: {
    padding: 8,
    marginLeft: -8,
  },

  // Progress Bar
  progressContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
  },
  progressSegment: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    width: "100%",
  },
  progressBarActive: {
    backgroundColor: "#176B51",
  },
  progressBarInactive: {
    backgroundColor: "#E2E8F0",
  },

  // Layout Containers
  desktopContainer: {
    flexDirection: "row",
    flex: 1,
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
    position: 'relative', // Context for footer
  },
  mobileContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a2e4c",
    marginBottom: 20,
  },
  desktopSidebar: {
    width: 350,
    backgroundColor: "#fff",
    borderLeftWidth: 1,
    borderLeftColor: "#eee",
    padding: 24,
    // Add padding bottom so content doesn't get hidden behind footer
    paddingBottom: 100,
  },

  // Grid Styles (Category)
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  gridItem: {
    width: "48%", // Approximately 2 columns
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gridItemActive: {
    borderColor: "#176B51",
    backgroundColor: "#F0FDF9",
  },
  gridText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
  },
  gridTextActive: {
    color: "#176B51",
    fontWeight: "700",
  },

  // Form Elements
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111",
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  textArea: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    color: "#111",
    minHeight: 120,
    textAlignVertical: "top",
  },

  // Chips
  suggestionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: "#E0F2F1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: {
    color: "#00695C",
    fontSize: 13,
    fontWeight: "500",
  },
  chipSmall: {
    borderWidth: 1,
    borderColor: "#176B51",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  chipTextSmall: {
    color: "#176B51",
    fontSize: 12,
    fontWeight: "500",
  },

  // Cards
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  // Date Time Specifics
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  dateSelectorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    flex: 1,
    marginLeft: 12,
    textTransform: 'capitalize'
  },
  changeLink: {
    color: "#176B51",
    fontWeight: "600",
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  timeSelector: {
    alignItems: "center",
    paddingVertical: 8,
  },
  timeBig: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a2e4c",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF8FF",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 10,
  },
  infoText: {
    color: "#2C5282",
    fontSize: 13,
    flex: 1,
  },

  // Toggles & Presets
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontWeight: "600",
    color: "#64748B",
  },
  toggleTextActive: {
    color: "#176B51",
  },
  presetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  presetCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  presetCircleActive: {
    backgroundColor: "#176B51",
    borderColor: "#176B51",
  },
  presetText: {
    fontWeight: "600",
    color: "#64748B",
    fontSize: 12,
  },
  presetTextActive: {
    color: "#fff",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  helperText: {
    fontSize: 12,
    color: "#9CA3AF",
  },

  // Summary
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#176B51",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  summarySub: {
    fontSize: 14,
    color: "#6B7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  urgentBadge: {
    marginTop: 8,
    backgroundColor: "#FEF2F2",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
    alignItems: "center",
  },
  urgentBadgeText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 12,
  },
  bodyText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },

  // Footer Actions
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingVertical: 16,
    paddingHorizontal: 20,
    // Add safe area padding for iOS X+
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    zIndex: 100, // Ensure footer is always on top
    elevation: 10,
  },
  footerInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
  },
  navButtonPrimary: {
    backgroundColor: "#176B51",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginLeft: "auto", // Push to right
    minWidth: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonSecondary: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  navButtonTextPrimary: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  navButtonTextSecondary: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },

  // Error Banner
  errorBanner: {
    backgroundColor: "#FEE2E2",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },

  // Preview Sidebar
  sidebarTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: 16,
  },
  previewCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  previewText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  previewPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: "#176B51",
  },
  imagePicker: {
    backgroundColor: '#e0e0e0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  imagePickerText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },

/* Web modal picker styles */
  webModalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start', // 1. Align content to the TOP of the screen
    alignItems: 'center',         // 2. Center content HORIZONTALLY
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 9999,
  },
  webModalCard: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    justifyContent: 'flex-start',
  },
  webModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    marginBottom: 8
  },
  webModalInput: {
    fontSize: 18,
    padding: 10, marginTop: 12,
    width: 280, borderWidth: 1,
    borderColor: '#ccc', borderRadius: 6,
    textAlign: 'center'
  },
  webModalButtonPrimary: { backgroundColor: '#176B51', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  webModalButtonSecondary: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#F3F4F6' },
  addressError: { color: '#DC2626', marginTop: 6, fontSize: 13 },
});