import { ThemedIcon } from '@/components/ThemedIcon';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/theme';
import { hapticImpact } from '@/utils/haptics';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import dayjs from 'dayjs';
import { useCallback, useMemo, useRef } from 'react';
import { Pressable, StyleProp, useColorScheme, View, ViewStyle } from 'react-native';
import DateTimePicker, { type DateType, useDefaultStyles } from 'react-native-ui-datepicker';

export type ThemedDatePickerSelectionMode = 'single' | 'range';

type BaseProps = {
    placeholder?: string;
    containerStyle?: StyleProp<ViewStyle>;
    minDate?: DateType;
    maxDate?: DateType;
    disabled?: boolean;
};

export type ThemedDatePickerSingleProps = BaseProps & {
    selectionMode: 'single';
    value?: string;
    onChange: (isoDate: string) => void;
};

export type ThemedDatePickerRangeProps = BaseProps & {
    selectionMode: 'range';
    startDate?: string;
    endDate?: string;
    onRangeChange: (start: string | undefined, end: string | undefined) => void;
};

export type ThemedDatePickerProps = ThemedDatePickerSingleProps | ThemedDatePickerRangeProps;

function dateTypeToIso(d: DateType): string | undefined {
    if (d == null || d === '') {
        return undefined;
    }
    const p = dayjs(d);
    return p.isValid() ? p.format('YYYY-MM-DD') : undefined;
}

function isoToDateType(iso: string | undefined): DateType {
    if (!iso) {
        return undefined;
    }
    const p = dayjs(iso);
    return p.isValid() ? p.toDate() : undefined;
}

/** Es. 2026-01-07 → "7-1-2026" come da richiesta (giorno-mese-anno). */
export function formatDateLabelItalian(iso: string): string {
    const p = dayjs(iso);
    if (!p.isValid()) {
        return iso;
    }
    return `${p.date()}-${p.month() + 1}-${p.year()}`;
}

function ThemedDatePicker(props: ThemedDatePickerProps) {
    const scheme = useColorScheme() ?? 'light';
    const placeholder = props.placeholder ?? 'Seleziona data';
    const sheetRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ['58%', '78%'], []);

    const defaultPickerStyles = useDefaultStyles();

    const pickerStyles = useMemo(() => {
        const fg = scheme === 'light' ? '#111' : '#FFF';
        const bg = scheme === 'light' ? Colors.light.background : Colors.dark.background;
        const muted = scheme === 'light' ? '#6B7280' : '#8E8E93';
        const accent = scheme === 'light' ? '#111111' : '#FFFFFF';
        const onAccent = scheme === 'light' ? '#FFFFFF' : '#111111';
        return {
            ...defaultPickerStyles,
            day_label: { color: fg },
            month_label: { color: fg },
            month_selector_label: { color: fg },
            year_selector_label: { color: fg },
            weekday_label: { color: muted },
            header: { backgroundColor: bg },
            days: { backgroundColor: bg },
            button_next: { tintColor: fg },
            button_prev: { tintColor: fg },
            selected: { backgroundColor: accent },
            selected_label: { color: onAccent },
            range_fill: { backgroundColor: scheme === 'light' ? '#E8E8ED' : '#333' },
            range_selected: { backgroundColor: accent },
            range_selected_label: { color: onAccent },
            today: { borderColor: muted },
        };
    }, [scheme, defaultPickerStyles]);

    const palette = useMemo(
        () =>
            scheme === 'light'
                ? { border: '#E5E5EA', inputBg: '#FAFAFA', muted: '#6B7280' }
                : { border: '#38383A', inputBg: '#1C1C1E', muted: '#8E8E93' },
        [scheme],
    );

    const sheetBg = scheme === 'light' ? Colors.light.background : Colors.dark.background;

    const labelText = useMemo(() => {
        if (props.selectionMode === 'single') {
            if (props.value) {
                return formatDateLabelItalian(props.value);
            }
            return placeholder;
        }
        const { startDate, endDate } = props;
        if (startDate && endDate) {
            return `${formatDateLabelItalian(startDate)} – ${formatDateLabelItalian(endDate)}`;
        }
        if (startDate) {
            return `${formatDateLabelItalian(startDate)} – …`;
        }
        return placeholder;
    }, [props, placeholder]);

    const isPlaceholder =
        props.selectionMode === 'single'
            ? !props.value
            : !props.startDate || !props.endDate;

    const openSheet = () => {
        hapticImpact('light');
        if (props.disabled) {
            return;
        }
        sheetRef.current?.present();
    };

    const renderBackdrop = useCallback(
        (backdropProps: React.ComponentProps<typeof BottomSheetBackdrop>) => (
            <BottomSheetBackdrop {...backdropProps} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.45} pressBehavior="close" />
        ),
        [],
    );

    const inputPadV = 14;

    return (
        <>
            <Pressable
                onPress={openSheet}
                disabled={props.disabled}
                style={[
                    {
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderRadius: 14,
                        paddingHorizontal: 14,
                        paddingVertical: inputPadV,
                        gap: 10,
                        backgroundColor: palette.inputBg,
                        borderColor: palette.border,
                        opacity: props.disabled ? 0.55 : 1,
                    },
                    props.containerStyle,
                ]}
            >
                <ThemedIcon name="calendar-outline" size={20} lightColor={palette.muted} darkColor={palette.muted} />
                <ThemedText
                    style={{ flex: 1, fontSize: 16 }}
                    lightColor={isPlaceholder ? palette.muted : scheme === 'light' ? '#111' : '#FFF'}
                    darkColor={isPlaceholder ? palette.muted : scheme === 'light' ? '#111' : '#FFF'}
                >
                    {labelText}
                </ThemedText>
            </Pressable>

            <BottomSheetModal
                ref={sheetRef}
                index={0}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: sheetBg }}
                handleIndicatorStyle={{ backgroundColor: scheme === 'light' ? '#C5C5C7' : '#555' }}
            >
                <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
                    {props.selectionMode === 'single' ? (
                        <DateTimePicker
                            mode="single"
                            date={isoToDateType(props.value)}
                            onChange={({ date }) => {
                                const iso = dateTypeToIso(date);
                                if (iso) {
                                    props.onChange(iso);
                                    sheetRef.current?.dismiss();
                                }
                            }}
                            maxDate={props.maxDate}
                            minDate={props.minDate}
                            styles={pickerStyles}
                            initialView="day"
                        />
                    ) : (
                        <DateTimePicker
                            mode="range"
                            startDate={isoToDateType(props.startDate)}
                            endDate={isoToDateType(props.endDate)}
                            onChange={({ startDate, endDate }) => {
                                const s = dateTypeToIso(startDate);
                                const e = dateTypeToIso(endDate);
                                props.onRangeChange(s, e);
                                if (s && e) {
                                    sheetRef.current?.dismiss();
                                }
                            }}
                            maxDate={props.maxDate}
                            minDate={props.minDate}
                            styles={pickerStyles}
                            initialView="day"
                        />
                    )}
                </BottomSheetScrollView>
            </BottomSheetModal>
        </>
    );
}

export default ThemedDatePicker;
