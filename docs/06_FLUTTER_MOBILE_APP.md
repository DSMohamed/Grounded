# 📱 Flutter Mobile Application Architecture & Implementation
### Cross-Platform Clinical Decision Support Client — Grounded

This document covers the complete architecture, design system, state management, and backend synchronization of the **Grounded Flutter Mobile Application** (`flutter-app/`).

---

## 📑 Table of Contents
1. [Overview & Bedside Clinical Mission](#1-overview--bedside-clinical-mission)
2. [Clean Architecture Directory Structure](#2-clean-architecture-directory-structure)
3. [State Management (Flutter Riverpod 2.x)](#3-state-management-flutter-riverpod-2x)
4. [Data Layer, DTOs & Freezed Code Generation](#4-data-layer-dtos--freezed-code-generation)
5. [Domain Layer & Use Cases](#5-domain-layer--use-cases)
6. [Presentation Layer & Dark Emerald Design System](#6-presentation-layer--dark-emerald-design-system)
7. [API Connectivity & Dynamic Environment Injection](#7-api-connectivity--dynamic-environment-injection)
8. [Build, CodeGen & Execution Guide](#8-build-codegen--execution-guide)

---

## 1. Overview & Bedside Clinical Mission

In hospital ward rounds and fast-paced outpatient clinics, physicians do not always have access to a desktop computer. The **Grounded Flutter Mobile Application** brings the full power of our evidence-bound clinical decision support engine directly to iOS, Android, and Windows desktop devices.

### Key Mobile Capabilities:
* **Point-of-Care Guideline Queries**: Instant sub-3s clinical inquiry with real-time streaming state feedback.
* **Interactive Expandable Citations**: Tap-to-expand citation cards revealing the exact document name, clinical section, page number, and original guideline passage.
* **Distinct Clinical Status Badges**: Visual color-coded differentiation between `Answered` (Emerald), `Insufficient Evidence` (Amber), and `Safety Refusal` (Red).
* **Zero-Persistence Option**: Fully transient conversational state for confidential patient-related inquiries.

---

## 2. Clean Architecture Directory Structure

The mobile client is built strictly following **Clean Architecture** principles to decouple business logic from UI rendering and network infrastructure:

```
flutter-app/
├── lib/
│   ├── core/                        # Infrastructure & shared utilities
│   │   ├── env.dart                 # Dynamic environment variable resolver
│   │   ├── env.example.dart         # Environment template
│   │   ├── result.dart              # Functional Result<T, E> error-handling type
│   │   └── network/
│   │       └── dio_client.dart      # Configured Dio HTTP client with interceptors
│   ├── data/                        # Data access & DTO serialization
│   │   ├── models/
│   │   │   ├── evidence_response.dart       # Freezed/JSON serializable DTOs
│   │   │   └── evidence_response.freezed.dart # Generated Freezed immutability code
│   │   └── repositories/
│   │       └── evidence_repository_impl.dart  # Concrete implementation of domain repository
│   ├── domain/                      # Pure business logic & contracts (zero Flutter imports)
│   │   ├── entities/                # Clinical business entities
│   │   ├── repositories/            # Abstract repository interfaces
│   │   └── usecases/                # Single-responsibility use cases
│   │       └── ask_clinical_question.dart
│   ├── presentation/                # UI widgets, screens, and state notifiers
│   │   ├── chat/
│   │   │   ├── chat_notifier.dart   # Riverpod AsyncNotifier managing chat history & loading
│   │   │   └── chat_screen.dart     # Main conversational screen with auto-scrolling
│   │   ├── theme/
│   │   │   └── app_theme.dart       # Dark emerald palette, typography, & GlassCard widget
│   │   └── widgets/
│   │       ├── answer_card.dart     # Expandable evidence card with verified citations
│   │       ├── chat_bubble.dart     # User & assistant speech bubbles
│   │       └── refusal_card.dart    # Safety refusal & insufficient evidence alert card
│   └── main.dart                    # Application bootstrap & ProviderScope root
├── pubspec.yaml                     # Dependencies (Riverpod, Dio, Freezed, Flutter Animate)
└── analysis_options.yaml            # Strict Dart lint rules
```

---

## 3. State Management (Flutter Riverpod 2.x)

**File**: `lib/presentation/chat/chat_notifier.dart`

We utilize **Riverpod 2.x** with code-generation annotations for type-safe, compile-time verified state management:

### State Model (`ChatState`):
```dart
class ChatState {
  final List<ChatMessage> messages;
  final bool isLoading;
  final String? error;
  final String? activeFilter;
  ...
}
```

### Async Query Flow:
1. When a clinician taps "Send", the notifier emits an immediate optimistic user message and sets `isLoading: true`.
2. The `AskClinicalQuestion` use case is executed via `DioClient`.
3. On successful response, the notifier appends the parsed `EvidenceResponse` and triggers a smooth scroll animation.
4. If a network timeout occurs, it gracefully presents an interactive retry action without clearing existing chat history.

---

## 4. Data Layer, DTOs & Freezed Code Generation

**File**: `lib/data/models/evidence_response.dart`

The mobile app strictly mirrors the backend Pydantic schema using **Freezed** and **`json_serializable`**:

```dart
@freezed
class EvidenceResponseDto with _$EvidenceResponseDto {
  const factory EvidenceResponseDto({
    required String status,
    required String recommendation,
    @JsonKey(name: 'supporting_evidence') required List<EvidenceItemDto> supportingEvidence,
    required String confidence,
    @JsonKey(name: 'missing_information') required String missingInformation,
    @JsonKey(name: 'safety_note') required String safetyNote,
    @JsonKey(name: 'risk_tier') required String riskTier,
    @JsonKey(name: 'decision_path') required String decisionPath,
    @JsonKey(name: 'retrieved_chunks') required List<RetrievedChunkDto> retrievedChunks,
    @JsonKey(name: 'weak_threshold') required double weakThreshold,
    @JsonKey(name: 'top_score') required double topScore,
    required String mode,
    required ValidationDto validation,
  }) = _EvidenceResponseDto;

  factory EvidenceResponseDto.fromJson(Map<String, dynamic> json) =>
      _$EvidenceResponseDtoFromJson(json);
}
```

### Regenerating Serialization Code:
Whenever DTO models are modified, run the build runner:
```bash
dart run build_runner build --delete-conflicting-outputs
```

---

## 5. Domain Layer & Use Cases

**File**: `lib/domain/usecases/ask_clinical_question.dart`

The domain layer contains zero dependencies on Flutter UI or third-party network libraries:
* **`EvidenceRepository` (Interface)**: Defines `Future<Result<EvidenceResponse, Failure>> ask(String question)`.
* **`AskClinicalQuestion` (Use Case)**: Encapsulates query trimming, validation constraints (1–1000 characters), and maps raw network exceptions into domain-friendly clinical error types.

---

## 6. Presentation Layer & Dark Emerald Design System

**File**: `lib/presentation/theme/app_theme.dart`

### Color Palette:
```dart
class AppColors {
  static const charcoal = Color(0xFF0F172A); // #0F172A Dark Slate Background
  static const cyan     = Color(0xFF06B6D4); // #06B6D4 Primary Accent
  static const mint     = Color(0xFF10B981); // #10B981 Verified Emerald Badge
  static const amber    = Color(0xFFF59E0B); // #F59E0B Caution / Insufficient
  static const red      = Color(0xFFEF4444); // #EF4444 Safety Refusal Alert
}
```

### Glassmorphic Card Styling (`GlassCard`):
Custom backdrop filter widget providing subtle opacity blur and dynamic border coloring:
```dart
class GlassCard extends StatelessWidget {
  final Widget child;
  final Color borderColor;
  ...
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
```

---

## 7. API Connectivity & Dynamic Environment Injection

**File**: `lib/core/env.dart`

The Flutter app resolves its backend endpoint at compile/run time via Dart `--dart-define` flags, defaulting to the live Render cloud deployment:

```dart
class Env {
  const Env._();

  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://grounded-o09a.onrender.com/ask',
  );
}
```

---

## 8. Build, CodeGen & Execution Guide

### 1. Install Flutter Dependencies:
```bash
cd flutter-app
flutter pub get
```

### 2. Run Code Generation:
```bash
dart run build_runner build --delete-conflicting-outputs
```

### 3. Run Locally with Live Render Cloud Backend:
```bash
flutter run -d windows --dart-define=API_BASE_URL=https://grounded-o09a.onrender.com/ask
```

### 4. Run with Local Ngrok Development Tunnel:
```bash
# In terminal 1 (starts FastAPI + PyNgrok tunnel):
python backend/server.py

# In terminal 2 (pointing to your printed tunnel URL):
flutter run -d windows --dart-define=API_BASE_URL=https://your-tunnel.ngrok-free.dev/ask
```

### 5. Build Release APK (Android):
```bash
flutter build apk --release --dart-define=API_BASE_URL=https://grounded-o09a.onrender.com/ask
```
