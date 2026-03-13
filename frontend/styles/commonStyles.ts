import { StyleSheet, Platform } from 'react-native';
import { brand } from '../constants/Colors';

const isWeb = Platform.OS === 'web';

export const commonStyles = StyleSheet.create({
  // Layout
  container: { padding: 30, maxWidth: 1200, alignSelf: 'center', width: '100%' },
  containerMobile: { padding: 16, maxWidth: '100%' },

  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerRowMobile: { marginBottom: 16 },
  pageTitle: { fontSize: 28, fontWeight: '700', color: brand.text },
  pageSubtitle: { fontSize: 16, color: brand.textHelper, marginTop: 4 },
  refreshBtn: { padding: 10, backgroundColor: brand.surface, borderRadius: 8, borderWidth: 1, borderColor: brand.border },

  // Tabs
  tabs: { flexDirection: 'row', marginBottom: 22, marginTop: 10, justifyContent: 'center', backgroundColor: brand.tabBg, paddingHorizontal: 6, paddingVertical: 6, borderRadius: 12, overflow: 'hidden' },
  tab: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: 'transparent', borderRadius: 8, marginRight: 8 },
  tabActive: { backgroundColor: brand.primary },
  tabText: { fontSize: 16, fontWeight: '500', color: brand.textSecondary },
  tabActiveText: { color: '#fff', fontWeight: '600' },

  // Job Card
  jobCard: { backgroundColor: brand.surface, padding: 12, marginBottom: 12 },
  jobCardMobile: { width: '100%', minWidth: 0, padding: 16 },
  jobImage: { width: 40, height: 40, borderRadius: 8, marginRight: 8 },
  jobTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  jobDescription: { fontSize: 14, color: '#4A4A4A', marginBottom: 6 },
  jobMeta: { color: brand.textHelper, fontSize: 13 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },

  // Price
  priceBadge: { backgroundColor: brand.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  priceText: { color: brand.primaryDark, fontWeight: '700', fontSize: 14 },

  // Details
  jobDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, color: brand.textSecondary },

  // Day Section
  daySection: { marginBottom: 32, backgroundColor: brand.surfaceAlt, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: brand.border },
  daySectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: brand.primary },
  daySectionTitle: { fontSize: 16, fontWeight: '600', color: brand.text, marginLeft: 8, flex: 1 },
  daySectionCount: { fontSize: 14, fontWeight: '500', color: brand.textSecondary },

  // Empty State
  emptyState: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  emptyText: { fontSize: 14, color: brand.textSecondary, textAlign: 'center', maxWidth: 300 },

  // Loading
  loadingState: { paddingVertical: 90, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E4E6EB', borderRadius: 12, padding: 20, width: '100%', minWidth: 300 },

  // Filters
  filterToggleBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: brand.filterBg, borderRadius: 8 },
  filterToggleText: { color: '#1a2e4c', fontWeight: '600' },
  filterRow: { flexDirection: 'row', gap: 12, marginBottom: 16, backgroundColor: brand.surface, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E8EEF2' },
  filterRowMobile: { flexDirection: 'column', gap: 16 },
  filterGroup: { flex: 1 },
  filterGroupMobile: { flex: 1, width: '100%' },
  filterLabel: { color: brand.textSecondary, marginBottom: 8, fontSize: 14, fontWeight: '600' },
  filterPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: brand.filterBg, marginRight: 8, marginBottom: 4 },
  filterBtnActive: { backgroundColor: brand.primary },
  filterBtnText: { color: '#333', fontWeight: '600' },
  filterBtnTextActive: { color: '#fff', fontWeight: '600' },

  // Footer
  footer: { marginTop: 60, paddingTop: 40, borderTopWidth: 1, borderTopColor: brand.border },
  footerTitle: { fontSize: 20, fontWeight: '700', color: brand.text, marginBottom: 12 },
  footerDescription: { fontSize: 14, color: brand.textSecondary, lineHeight: 20, maxWidth: 300 },
  footerBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTopWidth: 1, borderTopColor: brand.border },
  footerCopyright: { fontSize: 12, color: brand.textMuted },

  // Status badges
  pendingHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  pendingBadge: { fontSize: 12, fontWeight: '600', color: brand.warning },

  // Banner
  banner: { backgroundColor: brand.warningBg, borderLeftWidth: 4, borderLeftColor: brand.warning, padding: 16, borderRadius: 8, marginBottom: 20 },
  bannerTitle: { fontSize: 16, fontWeight: '700', color: '#92400E', marginBottom: 8 },
  bannerText: { fontSize: 14, color: '#78350F', lineHeight: 20, marginBottom: 12 },
  bannerBtn: { backgroundColor: brand.warning, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignSelf: 'flex-start' },
  bannerBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // Card Footer
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 16, borderTopWidth: 1, borderTopColor: brand.borderLight },
  postedTime: { fontSize: 12, color: brand.textMuted },
  viewLink: { fontSize: 14, color: brand.primary, fontWeight: '600' },

  // Jobs grid
  jobsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  jobsListMobile: { flexDirection: 'column', gap: 0 },
  jobsContainer: { marginBottom: 40 },
  jobsList: { gap: 12, marginTop: 8 },
});
