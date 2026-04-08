/**
 * User-facing copy aligned with Flutter `tap_app` (`main.dart` title, dashboard, auth).
 * Source: `../tap_app/lib/features/**` — adjust here when product copy changes.
 */

export const appStrings = {
  /** MaterialApp `title` in Flutter `main.dart`. */
  appDisplayName: "T.A.P by YasaLaser",
  /** Short product name (headers, logo). */
  appShortName: "T.A.P",
  tagline: "Treatment & Aesthetic Procedures",
  /** Flutter `HomePage` AppBar */
  dashboardTitle: "T.A.P Dashboard",

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
  quickActionSkinAnalyzerSub: "On-device pigmentation (iOS) — coming with dev build",
  /** Header: Face / Skin Analyzer screen */
  skinAnalyzerScreenTitle: "Skin analyzer",
  skinAnalyzerIntro:
    "This flow will capture or import a photo and run the pigmentation model on-device (CoreML on iOS). The native module is not wired yet in standard Expo Go.",
  skinAnalyzerBulletPipeline: "Train/export in skin_analyzer_model → pigment_segmentation.mlpackage",
  skinAnalyzerBulletXcode: "Development build + Xcode: bundle model, Vision inference, Expo Module → JS",
  skinAnalyzerBulletDocs: "See docs/SKIN_ANALYZER_IOS_DESIGN.md and sibling IOS_APP_INTEGRATION.md",
  skinAnalyzerLinkFaceMap: "Open Face Map (diagram shell)",

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

  noTreatmentsYet: "No treatments yet",
  noTreatmentsHint: "Start tracking your aesthetic procedures",
  addFirstTreatment: "Add First Treatment",

  offlineBanner: "Offline — changes may queue until you reconnect.",

  treatmentsLogged: (n: number) => `Treatments logged: ${n}`,

  treatmentServiceTypeSheetTitle: "Service type",
  treatmentServiceTypePlaceholder: "Choose a service type",
  treatmentServiceTypeEmptyList:
    "No service types for this treatment type. Check your connection or ask an admin to add rows in Catalog admin.",

  treatmentBrandLabel: "Brand",
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

  /** Login (`login_page.dart`) */
  loginHeadline: "Welcome Back To Your\nAesthetic Passport",
  loginSubtitle: "Sign in to continue tracking your treatments",
  signIn: "Sign In",
  forgotPassword: "Forgot Password?",
  emailPlaceholder: "Email",
  emailHint: "Enter your email address",
  passwordPlaceholder: "Password",
  passwordHint: "Enter your password",
  signUpCta: "Sign Up",
  alreadyHaveAccount: "Already have an account? Sign in",

  /** Sign up (`signup_page.dart`) */
  createAccount: "Create Account",
  joinHeadline: "Join T.A.P by YasaLaser",
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
  welcomeTitle: "Welcome to T.A.P",
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

  adminUsersTitle: "User admin",
  adminUsersAccessDenied: "You need an admin account to manage other users.",
  adminUsersHint:
    "Toggle admin for other accounts only. Your own admin flag cannot be changed here. Promote the first admin via SQL in Supabase.",

  appliesToInjectable: "Injectable",
  appliesToLaser: "Laser",
  appliesToBoth: "Both",
} as const;
