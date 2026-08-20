import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../domain/entities/evidence_answer.dart';
import '../theme/app_theme.dart';

class RefusalCard extends StatelessWidget {
  const RefusalCard({super.key, required this.answer, this.onRetry});

  final EvidenceAnswer answer;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      borderColor: AppColors.amber,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Unable to answer safely', style: TextStyle(color: AppColors.amber, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(answer.refusalMessage ?? 'Please rephrase or provide more context.'),
          const SizedBox(height: 12),
          FilledButton.tonalIcon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: const Text('Retry / rephrase'),
          ),
          const SizedBox(height: 8),
          const Text('For reference only — verify against primary source and clinical judgment.', style: TextStyle(fontSize: 12)),
        ],
      ),
    ).animate().fadeIn(duration: 180.ms).slideY(begin: 0.04, end: 0, duration: 180.ms);
  }
}
