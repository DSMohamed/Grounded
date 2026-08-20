import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../domain/entities/evidence_answer.dart';
import '../theme/app_theme.dart';

class AnswerCard extends StatelessWidget {
  const AnswerCard({super.key, required this.answer});

  final EvidenceAnswer answer;

  @override
  Widget build(BuildContext context) {
    final citation = answer.citation;
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Icon(Icons.verified, color: AppColors.mint),
            const SizedBox(width: 8),
            Text('Grounded answer • ${(answer.confidence * 100).round()}%', style: const TextStyle(color: AppColors.mint, fontWeight: FontWeight.w700)),
          ]),
          const SizedBox(height: 12),
          Text(answer.recommendation ?? ''),
          const SizedBox(height: 12),
          Text('Exact excerpt', style: Theme.of(context).textTheme.labelLarge?.copyWith(color: AppColors.cyan)),
          const SizedBox(height: 4),
          Text('“${answer.exactExcerpt ?? ''}”'),
          if (citation != null) ...[
            const Divider(height: 24),
            Text('${citation.document} • ${citation.section} • p. ${citation.page}'),
          ],
          const SizedBox(height: 8),
          const Text('For reference only — verify against primary source and clinical judgment.', style: TextStyle(fontSize: 12)),
        ],
      ),
    ).animate().fadeIn(duration: 180.ms).slideY(begin: 0.04, end: 0, duration: 180.ms);
  }
}
