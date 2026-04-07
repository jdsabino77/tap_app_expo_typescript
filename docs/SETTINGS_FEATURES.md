# T.A.P Settings & User Preferences

## Overview
Comprehensive settings page for user account management, preferences, and app configuration.

## Before production: Supabase email confirmation

**Interim (development):** In the Supabase dashboard, under **Authentication → Providers → Email**, leave **Confirm email** **disabled** so new accounts can sign in immediately without clicking a confirmation link.

**Before launch:** Re-enable **Confirm email** and finish the full flow:

- Set **Site URL** and **Redirect URLs** so confirmation links do not point at a dead default (e.g. `http://localhost:3000`).
- Use a stable app redirect (custom scheme / dev or store build), and allow-list it in Supabase; configure **`EXPO_PUBLIC_SUPABASE_AUTH_REDIRECT_URL`** if needed.
- Verify the link opens the app (or web) and establishes a session end-to-end.

Implementation details and checklist: **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** (email confirmation section).

## Calendar, appointments & EMR integration (strategy)

**Goal:** Patients often book their **next** visit when leaving the clinic. The app needs **upcoming** items on the home screen and a **Calendar** that mixes **logged treatments** (historical procedures) with **scheduled visits** stored in Postgres.

### Data model (Expo + Supabase)

- Table **`appointments`** (migration **`006_appointments.sql`**) holds user-scoped rows: **Consult** (first-time / evaluation) or **Treatment** (scheduled service), optional **injectable / laser** modality for treatment visits, **service type** and **brand** aligned with the treatment form catalogs, **scheduled_at**, optional **duration**, **provider**, **notes**, **status** (`scheduled` \| `cancelled` \| `completed`), and **`external_ref`** for ids from outside systems.
- **RLS:** users can only read/write their own rows (`user_id = auth.uid()`).
- The **Dashboard** loads the next few **`scheduled`** appointments **after now** for an **Upcoming appointments** section.
- The **Calendar** screen loads **all** appointments (for history/cancelled later if needed) and **treatments**, grouped by calendar day.

### Product behavior

- **Consult** is a first-class visit type (typical for new patients).
- **Treatment** reuses the same catalog-driven patterns as **New treatment** (service type, brand/device fields) but represents a **future** booking, not a completed log line in **`treatments`**.
- **Appointment detail (mobile):** users can **cancel** (`status = cancelled`), **mark completed** (consult-only or when not logging a procedure), or **Log treatment from this visit** → **New treatment** with date/provider (and treatment-style fields when applicable) prefilled; a successful online save sets **`appointments.status = completed`**. Offline-queued treatment saves do not auto-complete the linked appointment.

### EMR / clinic scheduling (future API)

- A **server-side API** (or Supabase **Edge Function** with service role) can accept webhooks or polls from an **EMR / scheduling** product when a patient **confirms** an appointment.
- That API should **upsert** into **`public.appointments`** for the matching **`user_id`** (resolved via mapped patient id or email), set **`external_ref`** to the EMR encounter id, and set **`scheduled_at`** / metadata from the EMR payload so the mobile app’s calendar updates without manual entry.
- **Security:** never expose the service role key in the app; only the backend or Edge Function should insert cross-system rows, or use **RLS-safe** patterns with user JWT if the EMR integration is per-user OAuth.

### Documentation

- Schema: **[SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md)** (`appointments` section).
- Apply migration: **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** step **006**.

## Current Implementation Status

### ✅ Completed Features

**Settings Page Structure:**
- Account section
- Preferences section  
- About section
- Actions section

**Functional Features:**
1. **Logout** - Signs user out and returns to login page
   - Confirmation dialog before logout
   - Clears Firebase Auth session
   - Removes all navigation history
   - Error handling for failed logout

2. **Close App** - Exits the application
   - Confirmation dialog before closing
   - Uses `SystemNavigator.pop()`
   - Works on iOS and Android

**Navigation:**
- Accessible from Profile page settings icon (gear)
- Uses MaterialPageRoute for consistency
- Back button returns to Profile page

## Planned Features (Coming Soon)

### Account Management

**Profile Settings** (High Priority)
- Edit first name and last name
- Update email address
- Change profile photo
- View account creation date
- Display user ID

**Change Password** (High Priority)
- Current password verification
- New password with strength indicator
- Confirm new password
- Password requirements display
- Success/error feedback

**Delete Account** (Low Priority)
- Permanent account deletion
- Data export before deletion
- Confirmation with password
- 30-day grace period option
- Email confirmation

### Preferences

**Dark Mode** (High Priority)
- Toggle between light and dark themes
- System theme option (follow device)
- Smooth theme transition
- Save preference to local storage
- Apply across entire app

**Implementation Plan:**
```dart
// 1. Create ThemeProvider
class ThemeProvider extends ChangeNotifier {
  ThemeMode _themeMode = ThemeMode.system;
  
  ThemeMode get themeMode => _themeMode;
  
  void setThemeMode(ThemeMode mode) {
    _themeMode = mode;
    notifyListeners();
    // Save to SharedPreferences
  }
}

// 2. Update MaterialApp
MaterialApp(
  themeMode: themeProvider.themeMode,
  theme: ThemeData.light(),
  darkTheme: ThemeData.dark(),
)

// 3. Settings toggle
Switch(
  value: themeMode == ThemeMode.dark,
  onChanged: (value) {
    provider.setThemeMode(
      value ? ThemeMode.dark : ThemeMode.light
    );
  },
)
```

**Notifications** (High Priority)
- Treatment reminders (1 day before, 1 week before)
- Appointment notifications
- New feature announcements
- Marketing communications toggle
- Push notification permissions
- Email notification preferences

**Language Selection** (Medium Priority)
- English (default)
- Spanish
- French
- Other languages as needed
- Save preference to Firestore
- Restart required notification

**Units Preference** (Medium Priority)
- Metric (mL, cm)
- Imperial (oz, in)
- Apply to all measurements
- Save to user profile

### About & Legal

**About T.A.P** (Medium Priority)
- App name: "The Aesthetic Passport"
- Version number (from pubspec.yaml)
- Build number
- YasaLaser branding
- Credits and acknowledgments
- Contact information

**Privacy Policy** (High Priority)
- Full privacy policy text
- Scrollable viewer
- Last updated date
- HIPAA compliance information
- Data collection practices
- Third-party services disclosure

**Terms & Conditions** (High Priority)
- Link to existing TermsAndConditionsPage
- Full terms text
- Last updated date
- User agreement acknowledgment
- Medical disclaimer

**Help & Support** (Medium Priority)
- FAQ section
- Contact support form
- Email: support@yasalaser.com
- Phone number
- Live chat (future)
- Tutorial videos

**App Version & Updates** (Low Priority)
- Current version display
- Check for updates button
- What's new in this version
- Update history
- Force update notification

### Data Management

**Export Data** (Medium Priority)
- Export all treatments as CSV
- Export as PDF report
- Include photos (optional)
- Email export to user
- Cloud storage backup

**Backup & Restore** (Medium Priority)
- Manual backup to cloud
- Automatic backup schedule
- Restore from backup
- Backup history
- Storage usage display

**Clear Cache** (Low Priority)
- Clear image cache
- Clear temporary files
- Clear local database cache
- Keep user data intact
- Display cache size

**Data Usage Statistics** (Low Priority)
- Total treatments logged
- Storage used
- Photos stored
- Data sync status
- Last backup date

## Implementation Priority

### Phase 1 (Next Sprint)
1. Change Password functionality
2. Dark Mode implementation
3. Privacy Policy viewer
4. Terms & Conditions linking

### Phase 2 (Following Sprint)
1. Notification preferences
2. Profile Settings editor
3. Help & Support section
4. About T.A.P page

### Phase 3 (Future)
1. Export Data functionality
2. Language selection
3. Backup & Restore
4. Delete Account

## Technical Requirements

### Dependencies Needed
```yaml
dependencies:
  # Theme management
  provider: ^6.0.0
  shared_preferences: ^2.2.0
  
  # Notifications
  firebase_messaging: ^14.6.0
  flutter_local_notifications: ^15.1.0
  
  # Data export
  csv: ^5.0.0
  pdf: ^3.10.0
  path_provider: ^2.1.0
  share_plus: ^7.0.0
```

### Files to Create
- `lib/core/theme/theme_provider.dart`
- `lib/core/theme/app_theme.dart`
- `lib/features/settings/presentation/pages/change_password_page.dart`
- `lib/features/settings/presentation/pages/profile_settings_page.dart`
- `lib/features/settings/presentation/pages/notification_settings_page.dart`
- `lib/features/settings/presentation/pages/about_page.dart`
- `lib/features/settings/presentation/pages/privacy_policy_page.dart`
- `lib/features/settings/presentation/pages/help_support_page.dart`

### State Management
- Use Provider for theme management
- SharedPreferences for local settings
- Firestore for user preferences (sync across devices)

## User Experience Considerations

### Confirmation Dialogs
- All destructive actions require confirmation
- Clear messaging about consequences
- Cancel option always available
- Red color for dangerous actions

### Loading States
- Show loading indicators for async operations
- Disable buttons during processing
- Timeout handling for network requests

### Error Handling
- User-friendly error messages
- Retry options for failed operations
- Log errors for debugging
- Graceful degradation

### Accessibility
- Screen reader support
- High contrast mode compatibility
- Large touch targets
- Clear labels and descriptions

## Security Considerations

### Password Changes
- Require current password
- Enforce password strength requirements
- Rate limiting for failed attempts
- Email notification of password change

### Account Deletion
- Require password confirmation
- Email verification
- Grace period before permanent deletion
- Data export option before deletion

### Data Export
- Encrypted export files
- Secure email transmission
- Temporary download links
- Automatic cleanup of exports

## Testing Checklist

### Functional Testing
- [ ] Logout successfully signs out user
- [ ] Close app exits application
- [ ] Dark mode toggles correctly
- [ ] Settings persist across app restarts
- [ ] Confirmation dialogs appear for destructive actions
- [ ] Navigation works correctly
- [ ] All "Coming Soon" features show placeholder

### UI Testing
- [ ] Settings page scrolls smoothly
- [ ] All sections are properly styled
- [ ] Icons are consistent
- [ ] Text is readable
- [ ] Cards have proper spacing
- [ ] Buttons are appropriately sized

### Integration Testing
- [ ] Settings sync with Firestore
- [ ] Theme changes apply app-wide
- [ ] Notifications work correctly
- [ ] Data export generates valid files
- [ ] Backup/restore works correctly

## Future Enhancements

### Advanced Features
- Two-factor authentication
- Biometric settings management
- App lock with PIN/biometric
- Session timeout configuration
- Data retention policies
- GDPR compliance tools

### Analytics
- Track feature usage
- Monitor settings changes
- Identify popular preferences
- A/B testing for UI improvements

### Integrations
- Apple Health integration settings
- Google Fit integration settings
- Third-party app connections
- API key management for developers
