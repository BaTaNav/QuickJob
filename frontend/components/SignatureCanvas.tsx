import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';

interface SignatureCanvasProps {
  visible: boolean;
  onSave: (signature: string) => void;
  onCancel: () => void;
  title?: string;
}

export default function SignatureCanvas({
  visible,
  onSave,
  onCancel,
  title = 'Client Signature',
}: SignatureCanvasProps) {
  const signatureRef = useRef<any>(null);

  const handleSave = (signature: string) => {
    // signature comes as data:image/png;base64,...
    onSave(signature);
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
  };

  const handleConfirm = () => {
    signatureRef.current?.readSignature();
  };

  const handleEmpty = () => {
    // User tried to save an empty canvas
  };

  const webStyle = `.m-signature-pad { box-shadow: none; border: none; }
    .m-signature-pad--body { border: 2px solid #E1E7EB; border-radius: 12px; }
    .m-signature-pad--footer { display: none; }
    body, html { width: 100%; height: 100%; }`;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>
              Please sign below to confirm job completion
            </Text>
          </View>

          {/* Signature Canvas */}
          <View style={styles.canvasContainer}>
            <SignatureScreen
              ref={signatureRef}
              onOK={handleSave}
              onEmpty={handleEmpty}
              webStyle={webStyle}
              backgroundColor="#FFFFFF"
              penColor="#041316"
              dotSize={2}
              minWidth={1.5}
              maxWidth={3}
              style={styles.canvas}
            />
          </View>

          {/* Hint */}
          <Text style={styles.hint}>Draw your signature above</Text>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleConfirm}>
              <Text style={styles.saveBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#041316',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#5D6B73',
    textAlign: 'center',
    marginTop: 4,
  },
  canvasContainer: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E1E7EB',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  canvas: {
    flex: 1,
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E1E7EB',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#5D6B73',
    fontWeight: '600',
    fontSize: 15,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#F59E0B',
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#F59E0B',
    fontWeight: '600',
    fontSize: 15,
  },
  saveBtn: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#176B51',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
