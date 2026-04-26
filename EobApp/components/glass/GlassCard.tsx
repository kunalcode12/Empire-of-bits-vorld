import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

type GlassCardProps = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  innerStyle?: ViewStyle;
};

export function GlassCard({
  children,
  style,
  intensity = 15,
  innerStyle,
}: GlassCardProps) {
  return (
    <View style={[styles.glassCard, style]}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View style={[styles.glassInner, innerStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  glassInner: {
    padding: 20,
  },
});
