import {StyleSheet} from 'react-native';
import { ColorPalette } from '../../contexts/AccessibilityContext';

export const makeStyles = (colors: ColorPalette, fontScale: number) => StyleSheet.create({
    container: {
        backgroundColor: colors.background,
        flex: 1, 
    },
    title: {
        color: colors.primary,
        fontSize: 20 * fontScale,
        fontWeight: 'bold',
        marginBottom: 10,
        marginLeft: 16,
        marginTop: 20,
        textAlign: 'center'
    },
    sectionHeader: {
        fontSize: 18 * fontScale,
        fontWeight: 'bold',
        color: colors.primary,
        backgroundColor: colors.background,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16 * fontScale,
        color: colors.textSecondary,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: colors.surface,
        padding: 28,
        borderRadius: 16,
        width: '80%',
        alignItems: 'center',
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        padding: 4,
    },
    modalTitle: {
        fontSize: 20 * fontScale,
        fontWeight: 'bold',
        marginBottom: 4,
        color: colors.text,
    },
    modalMedication: {
        fontSize: 16 * fontScale,
        marginBottom: 24,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    inputLabel: {
        fontSize: 14 * fontScale,
        color: colors.textSecondary,
        marginBottom: 10,
        fontWeight: '500',
    },
    timeInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 28,
    },
    timeInputBox: {
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: 10,
        width: 64,
        height: 54,
        textAlign: 'center',
        fontSize: 22 * fontScale,
        fontWeight: 'bold',
        color: colors.text,
        backgroundColor: colors.inputBackground,
    },
    timeInputSeparator: {
        fontSize: 26 * fontScale,
        fontWeight: 'bold',
        marginHorizontal: 10,
        color: colors.text,
    },
    modalButton: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
        marginBottom: 12,
        minHeight: 48,
    },
    modalButtonError: {
        backgroundColor: colors.error,
    },
    modalButtonText: {
        color: colors.textOnPrimary,
        fontSize: 16 * fontScale,
        fontWeight: 'bold',
    },
});