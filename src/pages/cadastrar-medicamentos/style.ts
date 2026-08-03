import { StyleSheet } from 'react-native';
import { ColorPalette } from '../../contexts/AccessibilityContext';

export const makeStyles = (colors: ColorPalette, fontScale: number, highContrast: boolean) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16 * fontScale,
    fontWeight: 'bold',
  },
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22 * fontScale,
    fontWeight: '500',
    marginVertical: 20,
    textAlign: 'center',
    color: colors.primary,
    marginBottom: 30,
    marginTop: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    backgroundColor: colors.inputBackground,
    color: colors.text,
    fontSize: 14 * fontScale,
    justifyContent: 'center',
    minHeight: 48, 
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    marginTop: 20,
  },
  buttonText: {
    color: colors.textOnPrimary,
    fontSize: 16 * fontScale,
    fontWeight: 'bold',
  },
  dosagemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dosagemInput: {
    flex: 1,
    marginRight: 20,
  },
  dosagemUnidadeInput: {
    flex: 1,
  },
  labelField: {
    fontSize: 14 * fontScale,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    marginTop: 4,
  },
  timePickerText: {
    fontSize: 14 * fontScale,
    color: colors.text,
  },
  sectionDividerText: {
    fontSize: 16 * fontScale,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 15,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 5,
  },
  estoqueInfoBox: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
  },
  estoqueOk: {
    backgroundColor: highContrast ? '#003300' : '#d4edda',
    borderColor: highContrast ? '#004400' : '#c3e6cb',
  },
  estoqueAviso: {
    backgroundColor: highContrast ? '#332200' : '#fff3cd',
    borderColor: highContrast ? '#443300' : '#ffeeba',
  },
  estoqueAjudaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -12,
    marginBottom: 12,
  },
  estoqueAjudaText: {
    flex: 1,
    fontSize: 12 * fontScale,
    color: colors.textSecondary,
    marginLeft: 6,
  }
});