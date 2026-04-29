/**
 * User-facing copy aligned with Flutter `tap_app` (`main.dart` title, dashboard, auth).
 * Source: `../tap_app/lib/features/**` — adjust here when product copy changes.
 */

export const appStrings = {
  /** MaterialApp `title` in Flutter `main.dart`. */
  appDisplayName: "DermaPass by Yasa",
  /** Short product name (headers, logo). */
  appShortName: "DermaPass",
  tagline: "Treatment & Aesthetic Procedures",
  /** Flutter `HomePage` AppBar */
  dashboardTitle: "DermaPass Dashboard",

  welcomeBackTitle: "Welcome back!",
  welcomeBackSubtitle: "Track your aesthetic journey with confidence",

  quickActions: "Quick Actions",
  quickActionNewTreatment: "New Treatment",
  quickActionNewTreatmentSub: "Log a new procedure",
  quickActionFaceMap: "Face Map",
  quickActionFaceMapSub: "Interactive face diagram",
  quickActionProviders: "Providers",
  quickActionProvidersSub: "Find locations",
  quickActionCalendar: "Calendar",
  quickActionCalendarSub: "Appointments",
  quickActionProfile: "Profile",
  quickActionProfileSub: "Medical info",
  quickActionSkinAnalyzer: "Face / Skin Analyzer",
  quickActionSkinAnalyzerSub: "On-device pigmentation preview (iOS)",
  quickActionPhotoLibrary: "Photo Library",
  quickActionPhotoLibrarySub: "Browse and compare progress photos",
  photoLibraryTitle: "Photo Library",
  photoLibraryEmpty: "No treatment photos yet. Add photos when you log a treatment.",
  photoLibraryCompareCta: "Compare",
  photoLibrarySelectionCount: (n: number) => `${n} of 4 selected`,
  photoCompareTitle: "Compare photos",
  /** Header: Face / Skin Analyzer screen */
  skinAnalyzerScreenTitle: "Skin analyzer",
  /** Beta / trust — shown prominently above the analyzer UI. */
  skinAnalyzerNonDiagnosticBanner:
    "Demonstration only — not a medical device. Results are not a diagnosis or treatment recommendation. For clinical decisions, see your licensed provider.",
  skinAnalyzerIntro:
    "Choose a photo for on-device pigmentation segmentation (Core ML). Outputs are educational previews, not diagnostic.",
  skinAnalyzerPickPhoto: "Choose photo",
  /** Shown after a successful run — same action re-opens the picker and re-runs the model. */
  skinAnalyzerPickAnotherPhoto: "Choose another photo",
  skinAnalyzerWorkflowHint:
    "As soon as you confirm a photo in the picker, the app runs Core ML and updates the results below. Tap the button again to analyze a different image.",
  skinAnalyzerAnalyzing: "Analyzing…",
  skinAnalyzerAffectedLabel: "Pigmented area in frame (estimate)",
  skinAnalyzerMaskCaption: "Model mask (PNG preview)",
  skinAnalyzerConditionSectionTitle: "By condition (exclusive — preview)",
  skinAnalyzerConditionPreviewDisclaimer:
    "Layout preview only. Numbers are placeholders. The current model outputs one pigment mask, not separate classes. After multi-class training, these rows will reflect real exclusive-class area shares.",
  skinAnalyzerConditionMelasma: "Melasma",
  skinAnalyzerConditionSolarLentigines: "Solar lentigines (sun / age spots)",
  skinAnalyzerConditionFreckles: "Freckles (ephelides)",
  skinAnalyzerConditionPIH: "Post-inflammatory hyperpigmentation (PIH)",
  skinAnalyzerRecommendedTitle: "Recommended treatments (preview)",
  skinAnalyzerRecommendedDisclaimer:
    "Educational suggestions only — not medical advice. Later: load from Supabase using condition → service / laser catalog mapping. ",
  skinAnalyzerBulletPipeline: "Train/export in skin_analyzer_model → pigment_segmentation.mlpackage",
  skinAnalyzerBulletXcode: "Development build + Xcode: bundle model, Vision inference, Expo Module → JS",
  skinAnalyzerBulletDocs: "See docs/SKIN_ANALYZER_IOS_DESIGN.md and sibling IOS_APP_INTEGRATION.md",

  recentTreatments: "Recent Treatments",
  upcomingAppointments: "Upcoming appointments",
  noUpcomingAppointments: "No upcoming appointments — book your next visit from Calendar.",
  addAppointmentCta: "Add appointment",
  newAppointmentTitle: "New appointment",
  appointmentKindLabel: "Visit type",
  appointmentKindConsult: "Consult",
  appointmentKindTreatment: "Treatment",
  appointmentDateLabel: "Date (YYYY-MM-DD)",
  appointmentTimeLabel: "Time (24h, HH:mm)",
  appointmentDurationHint: "Duration (minutes, optional)",
  appointmentScheduledHint: "Must be a future date and time.",
  appointmentDetailTitle: "Appointment",
  editAppointmentTitle: "Edit appointment",
  appointmentProviderLine: "Provider",
  appointmentNoProvider: "No provider selected",
  appointmentEditCta: "Edit",
  saveAppointmentChanges: "Save changes",
  appointmentNotesLabel: "Notes",
  appointmentDurationLabel: "Duration",
  appointmentStatusLabel: "Status",
  appointmentCancelCta: "Cancel appointment",
  appointmentCancelTitle: "Cancel this appointment?",
  appointmentCancelMessage: "It will be removed from your upcoming visits. You can add a new one anytime.",
  appointmentCompleteCta: "Mark as completed",
  appointmentCompleteTitle: "Mark this visit completed?",
  appointmentCompleteMessage:
    "Use this when the visit happened and you are not logging a treatment in the app (for example, a consult only).",
  appointmentLogVisitCta: "Log treatment from this visit",
  appointmentLogVisitHint:
    "Opens new treatment with date and provider prefilled. Saving marks this appointment completed.",
  appointmentCompleteAfterTreatmentWarning:
    "Treatment saved, but the appointment could not be marked completed. Open the appointment and tap Mark as completed.",
  appointmentOfflineLinkedAppointmentNote:
    "The linked appointment stays scheduled until you are online—then mark it completed from appointment details.",
  calendarListHint: "Logged treatments and upcoming visits by day. Add clinic visits from the button above.",
  calendarEmpty: "Nothing on your calendar yet. Log a past treatment or add an upcoming appointment.",
  /** Calendar / list filters (issue #30) */
  filterDateAllTime: "All dates",
  filterDateThisMonth: "This month",
  filterDateThisYear: "This year",
  filterDateLast3Months: "Last 3 months",
  filterDateChooseMonth: "Month…",
  filterDateModalTitle: "Choose month and year",
  filterMonthLabel: "Month",
  filterYearLabel: "Year",
  filterApply: "Apply",
  filterCancel: "Cancel",
  filterClear: "Clear filters",
  filterActivePrefix: "Showing:",
  filterCalendarNoMatches: "No visits in this date range. Try another filter or clear filters.",
  filterTreatmentsNoMatches: "No treatments match these filters. Clear filters to see everything.",
  filterTreatmentTypesLabel: "Treatment type",
  filterServiceSubtypeLabel: "Service / category",
  filterSubtypeUnspecified: "Unspecified",

  noTreatmentsYet: "No treatments yet",
  noTreatmentsHint: "Start tracking your aesthetic procedures",
  addFirstTreatment: "Add First Treatment",

  offlineBanner: "Offline — changes may queue until you reconnect.",

  treatmentsLogged: (n: number) => `Treatments logged: ${n}`,

  treatmentServiceTypeSheetTitle: "Service type",
  treatmentServiceTypePlaceholder: "Choose a service type",
  treatmentServiceTypeEmptyList:
    "No service types for this treatment type. Check your connection or ask an admin to add rows in Catalog admin.",

  /** Top-level treatment modality chip (maps to `treatment_type` = laser in DB). */
  treatmentTypeEnergyBasedDevicesLabel: "Energy Based Devices",
  treatmentTypeInjectableLabel: "Injectable",
  treatmentTypeSkinTreatmentsLabel: "Skin Treatments",
  /** Long-form EBD name where useful (e.g. admin copy). */
  ebdTypeLabel: "EBD (Energy Based Devices)",
  ebdModalityLabel: "Modality",
  ebdModalityLaser: "Laser",
  ebdModalityPhotofacial: "Photofacial",
  ebdTreatmentCategoryLabel: "Treatment category",
  ebdTreatmentCategorySheetTitle: "Treatment category",
  ebdTreatmentCategoryPlaceholder: "Choose a treatment category",

  /** Field label above the picker — matches sheet title per treatment modality. */
  treatmentBrandLabelInjectable: "Product / brand",
  treatmentBrandLabelLaser: "Laser / device",
  treatmentBrandLaserTitle: "Laser / device",
  treatmentBrandInjectableTitle: "Product / brand",
  treatmentBrandPlaceholder: "Choose a brand or product",
  treatmentBrandNoCatalogListHint:
    "No brands are configured for this service type yet — you can type a value below (optional).",
  treatmentBrandOtherHint: 'Required when "Other" is selected: enter the specific product or device name.',
  treatmentBrandOptionalPlaceholder: "Type brand or product (optional)",
  treatmentAreasSummaryNone: "Areas selected: none — tap suggestions below.",
  treatmentAreasSummaryPrefix: "Areas selected:",
  treatmentAreasLegacyNote:
    "These areas are not in the current catalog. Tap × to remove, or keep them and they will still be saved.",
  treatmentAreasSuggestionsLabel: "Area suggestions (tap to add or remove)",
  treatmentAreasSearchPlaceholder: "Search areas",
  treatmentAreasSearchAccessibilityLabel: "Filter treatment areas by name",
  treatmentAreasFilterEmpty: "No areas match your search.",
  treatmentAreasRegionHead: "Head",
  treatmentAreasRegionUpperBody: "Upper body",
  treatmentAreasRegionLowerBody: "Lower body",
  treatmentAreasRegionHeaderHint: "Shows or hides area options for this region",
  treatmentAreasRegionSelectedInRegion: (count: number) =>
    count === 0 ? "" : ` · ${count} selected`,

  /** Full-screen treatment photo viewer (issue #25). */
  /** Full-screen photo viewer — top-right control (see treatment-photo-viewer). */
  treatmentPhotoViewerCloseA11y: "Close full screen photo",
  treatmentPhotoViewerCounter: (current: number, total: number) => `${current} of ${total}`,
  treatmentPhotoThumbnailA11y: "View photo full screen",

  /** Login (`login_page.dart`) */
  loginHeadline: "Welcome Back To Your\nAesthetic Passport",
  loginSubtitle: "Sign in to continue tracking your treatments",
  signIn: "Sign In",
  forgotPassword: "Forgot Password?",
  forgotPasswordTitle: "Reset password",
  forgotPasswordSubtitle:
    "Enter the email for your account. We will send a link to open the app and sign you in so you can choose a new password.",
  sendResetEmail: "Send reset link",
  resetEmailSentNotice:
    "If an account exists for that address, you will get an email with a link shortly. Open it on this device.",
  backToSignIn: "Back to sign in",
  emailPlaceholder: "Email",
  emailHint: "Enter your email address",
  passwordPlaceholder: "Password",
  passwordHint: "Enter your password",
  signUpCta: "Sign Up",
  alreadyHaveAccount: "Already have an account? Sign in",

  /** Sign up (`signup_page.dart`) */
  createAccount: "Create Account",
  joinHeadline: "Join DermaPass by Yasa",
  joinSubtitle: "Create your account to start tracking treatments",
  /** Shown on sign-up — keeps expectations aligned with Auth + `profiles` trigger + separate medical form. */
  signUpWhatHappensHint:
    "What happens next: we create your secure sign-in and a profile with your name and email. If your project uses email confirmation, check your inbox before logging in. Health and safety details are saved when you open Medical profile (not during this step).",

  firstNamePlaceholder: "First Name",
  firstNameHint: "Enter your first name",
  lastNamePlaceholder: "Last Name",
  lastNameHint: "Enter your last name",
  confirmPasswordPlaceholder: "Confirm password",

  /** Welcome (`welcome_page.dart`) — returns to sign-in (signs out the session). */
  welcomeExitSignOut: "Sign out",
  /** Welcome (`welcome_page.dart`) */
  welcomeTitle: "Welcome to DermaPass",
  welcomeBody:
    "Let's get started by setting up your medical profile. This information helps us provide you with personalized treatment tracking.",
  welcomeFeature1Title: "Track Your Treatments",
  welcomeFeature1Sub: "Keep a detailed record of all your aesthetic procedures",
  welcomeFeature2Title: "Schedule & Plan",
  welcomeFeature2Sub: "Manage your treatment calendar and appointments",
  welcomeFeature3Title: "View Analytics",
  welcomeFeature3Sub: "See insights about your treatment history",

  /** Splash — skip animation to sign-in. */
  splashSkip: "Skip",
  setUpMedicalProfile: "Set Up Medical Profile",

  /** Legal / terms */
  termsAndConditions: "Terms and Conditions",
  privacyPolicy: "Privacy Policy",
  settingsVersionLabel: "Version",
  settingsBuildLabel: "Native build",
  settingsAppearanceSection: "Appearance",
  settingsThemeLight: "Light",
  settingsThemeDark: "Dark",
  settingsThemeSystem: "System (follow device)",
  profileSettingsTitle: "Profile",
  profileSettingsIntro:
    "Update the name and email on your account, and choose a profile photo. Email changes may require confirmation from your inbox.",
  profileSettingsAvatarHint: "Tap the image to choose a new photo from your library.",
  profileSettingsRemovePhoto: "Remove photo",
  profileSettingsChangePhoto: "Change photo",
  profileSettingsFirstName: "First name",
  profileSettingsLastName: "Last name",
  profileSettingsEmail: "Email",
  profileSettingsUserId: "User ID",
  profileSettingsAccountCreated: "Account created",
  profileSettingsSave: "Save changes",
  profileSettingsSavedTitle: "Saved",
  profileSettingsSavedBody: "Your profile was updated.",
  profileSettingsEmailInvalid: "Enter a valid email address.",
  profileSettingsNameRequired: "First and last name cannot be empty.",
  profileSettingsEmailConfirmTitle: "Confirm your email",
  profileSettingsEmailConfirmBody:
    "Your name and profile photo were saved. We sent a message to the new address — open the link there to finish the email change. Until then, you may still sign in with your current email.",
  profileSettingsPendingEmailBanner: (email: string) =>
    `Confirm ${email} from the message we sent — your sign-in email has not switched yet.`,
  profileSettingsStubUnavailable: "Profile editing requires a signed-in Supabase account.",
  legalOpenFullPrivacyWebsite: "View full privacy policy on yasalaser.com",
  legalOpenFullTermsWebsite: "View terms of use on yasalaser.com",
  legalPrivacySummaryLead:
    "YASA Laser Clinic describes how we handle personal information on our website and services. The full policy lives on our site — use the button below to read it in Safari.",
  photoPermissionDeniedTitle: "Photo access needed",
  photoPermissionDeniedMessage:
    "Allow photo library access to attach images, or enable it under Settings → DermaPass → Photos.",
  cameraPermissionDeniedTitle: "Camera access needed",
  cameraPermissionDeniedMessage:
    "Allow camera access to take treatment photos, or enable it under Settings → DermaPass → Camera.",
  photoPermissionOpenSettings: "Open Settings",
  termsCheckboxLead: "I agree to the ",
  acceptTermsToContinue: "Please accept the terms and conditions to continue",

  /** Alerts */
  checkEmailTitle: "Check your email",
  checkEmailBody: "Confirm your account, then sign in.",

  medicalProfileLoadFailed: "Could not load your saved profile. You can still edit and save.",

  medicalProfileIntro:
    "Add health details for safer treatment tracking. Choose gender, ethnicity, and skin type from the lists; use YYYY-MM-DD for date of birth.",
  medicalProfileOnboardingBadge: "Onboarding",
  medicalProfileDobLabel: "Date of birth",
  medicalProfileDobHint: "Use YYYY-MM-DD (example: 1990-05-15).",
  medicalProfileGenderLabel: "Gender",
  medicalProfileEthnicityLabel: "Ethnicity",
  medicalProfileSkinTypeLabel: "Skin type (Fitzpatrick)",
  medicalProfileAllergiesLabel: "Allergies",
  medicalProfileAllergiesPlaceholder: "Comma-separated (e.g. Penicillin, Latex)",
  medicalProfileMedicationsLabel: "Medications",
  medicalProfileMedicationsPlaceholder: "Comma-separated",
  medicalProfileConditionsLabel: "Medical conditions",
  medicalProfileConditionsPlaceholder: "Comma-separated",
  medicalProfilePrevTreatmentsLabel: "Previous treatments",
  medicalProfilePrevTreatmentsPlaceholder: "Comma-separated",
  medicalProfileNotesLabel: "Notes",
  medicalProfileNotesPlaceholder: "Optional notes for your provider",
  medicalProfileCheckFieldsBody: "Something went wrong validating gender, ethnicity, or skin type. Try reopening the screen.",
  medicalProfileSave: "Save",

  /** Hub links (Expo uses a stack hub; Flutter uses bottom nav — labels match nav intent) */
  navTreatments: "Treatments",
  navProviders: "Providers",
  navSettings: "Settings",
  navMedicalProfile: "Medical profile",
  navCalendar: "Calendar",
  navFaceMap: "Face map",
  navSkinAnalyzer: "Skin analyzer",

  /** Face map shell */
  faceMapScreenTitle: "Face Map",
  goToTreatments: "Go to treatments",

  splashRedirecting: "Redirecting to sign in…",

  /** Reference catalog admin (`profiles.is_admin`) */
  catalogAdminTitle: "Catalog admin",
  catalogAdminLaserTab: "Laser types",
  catalogAdminEbdTab: "EBD categories",
  catalogAdminServiceTab: "Service types",
  catalogAdminAreaTab: "Treatment areas",
  catalogAdminProviderTab: "Provider services",
  catalogAdminAddRow: "Add row",
  catalogAdminSave: "Save",
  catalogAdminDelete: "Delete",
  catalogAdminAccessDenied: "You need an admin account to manage reference catalogs.",
  catalogAdminHint:
    "Changes clear the local catalog cache and apply on next fetch. Assign admins in Supabase: update profiles set is_admin = true where id = '…'.",
  catalogAdminDeleteConfirmTitle: "Delete this row?",
  catalogAdminDeleteConfirmBody: "This cannot be undone. Chips may still show cached data until refresh.",
  catalogAdminEbdAllowedDevicesLabel: "Allowed devices (laser types)",
  catalogAdminAreaBodyRegion: "Body region",
  catalogAdminAreaBodyRegionHead: "Head",
  catalogAdminAreaBodyRegionUpper: "Upper body",
  catalogAdminAreaBodyRegionLower: "Lower body",
  catalogAdminAreaCategoryNotes: "Category notes (optional)",

  adminUsersTitle: "User admin",
  adminUsersAccessDenied: "You need an admin account to manage other users.",
  adminUsersHint:
    "Toggle admin for other accounts only. Your own admin flag cannot be changed here. Promote the first admin via SQL in Supabase.",

  appliesToInjectable: "Injectable",
  appliesToLaser: "Laser",
  appliesToBoth: "Both",
} as const;
