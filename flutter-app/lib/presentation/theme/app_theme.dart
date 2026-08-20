import 'dart:ui';

import 'package:flutter/material.dart';

class AppColors {
  static const charcoal = Color(0xFF0F172A);
  static const cyan = Color(0xFF06B6D4);
  static const mint = Color(0xFF10B981);
  static const amber = Color(0xFFF59E0B);
  static const red = Color(0xFFEF4444);
}

class AppTheme {
  static ThemeData dark() {
    final base = ThemeData.dark(useMaterial3: true);
    return base.copyWith(
      scaffoldBackgroundColor: AppColors.charcoal,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.cyan,
        brightness: Brightness.dark,
        surface: const Color(0xFF111827),
      ),
      textTheme: base.textTheme.apply(fontFamily: 'Roboto'),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.06),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(18), borderSide: BorderSide.none),
      ),
    );
  }
}

class GlassCard extends StatelessWidget {
  const GlassCard({super.key, required this.child, this.borderColor = AppColors.cyan});

  final Widget child;
  final Color borderColor;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.07),
            border: Border.all(color: borderColor.withValues(alpha: 0.35)),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Padding(padding: const EdgeInsets.all(16), child: child),
        ),
      ),
    );
  }
}
