# Clinical Evidence Assistant

Flutter app for citation-bound clinical evidence lookup. It renders grounded answers only when the backend response validates against the required schema; otherwise it shows a structured refusal or error state.

## API_BASE_URL

Set the backend URL at build/run time:

```bash
flutter run --dart-define=API_BASE_URL=https://xxxx.ngrok-free.app
```

`lib/core/env.dart` reads `String.fromEnvironment('API_BASE_URL')`. Keep real URLs/secrets out of source control; `lib/core/env.example.dart` is the checked-in template.

## Expected backend JSON contract

```json
{
  "status": "GROUNDED | REFUSED",
  "confidence": 0.0,
  "recommendation": "string | null",
  "exact_excerpt": "string | null",
  "citation": {
    "document": "string",
    "section": "string",
    "page": 0
  },
  "refusal_message": "string | null",
  "refusal_reason": "OUT_OF_SCOPE | LOW_CONFIDENCE | NO_CONTEXT | null"
}
```

If `status == "GROUNDED"`, `recommendation`, `exact_excerpt`, and `citation` must be non-null. Client-side confidence below `0.55` is forced to refusal rendering.

## Run checks

```bash
flutter pub get
flutter analyze
flutter test
```
