# Printer Billing Application - File Structure

## Root Structure
```
printerApp/
├── app/                        # Next.js App Router pages and layouts
├── components/                 # Reusable React components
├── lib/                        # Utility functions and data store
├── hooks/                      # Custom React hooks
├── python/                     # Data collection service
├── scripts/                    # Deployment and setup scripts
├── infra/                      # Infrastructure configuration
├── public/                     # Static assets served directly
├── styles/                     # Global CSS styles
├── .next/                      # Next.js build artifacts (generated)
├── node_modules/               # Node.js dependencies (generated)
├── package.json                # Node.js dependencies and scripts
├── pnpm-lock.yaml              # pnpm dependency lock file
├── next.config.mjs             # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.mjs          # PostCSS configuration
├── components.json             # shadcn/ui configuration
├── firestore.rules             # Firebase security rules
├── plan.md                     # Project roadmap and development history
├── filestructure.md            # This file - project structure overview
├── documentation.md            # Technical documentation
├── lessons.md                  # Development lessons and fixes
├── .env.local                  # Environment variables (Firebase config)
├── .gitignore                  # Git ignore rules
├── README.md                   # Project overview and setup instructions
└── next-env.d.ts               # Next.js TypeScript definitions
```

## App Router Directory (`app/`)
```
app/
├── layout.tsx                  # Root layout with navigation and providers
├── page.tsx                    # Home page with login redirect
├── globals.css                 # Global CSS styles with Tailwind imports
├── login/                      # Authentication pages
│   └── page.tsx                # Login page with Firebase authentication
├── dashboard/                  # User dashboard
│   └── page.tsx                # User dashboard with statistics and charts
├── printing/                   # Print-related pages
│   └── page.tsx                # Print history and job management
├── lamination/                 # Lamination pages
│   └── page.tsx                # Lamination history and management
├── profile/                    # User profile pages
│   └── page.tsx                # User profile management
└── admin/                      # Admin interface pages
    ├── page.tsx                # Admin dashboard
    ├── loading.tsx             # Loading state for admin pages
    ├── users/                  # User management
    └── populate-data/          # Data population utilities
        └── page.tsx            # Data population interface
```

## Components Directory (`components/`)
```
components/
├── ui/                         # shadcn/ui base components
│   ├── accordion.tsx           # Collapsible content component
│   ├── alert-dialog.tsx        # Alert dialog component
│   ├── alert.tsx               # Alert notification component
│   ├── aspect-ratio.tsx        # Aspect ratio wrapper
│   ├── avatar.tsx              # User avatar component
│   ├── badge.tsx               # Badge/tag component
│   ├── breadcrumb.tsx          # Navigation breadcrumbs
│   ├── button.tsx              # Button component with variants
│   ├── calendar.tsx            # Date picker calendar
│   ├── card.tsx                # Card container component
│   ├── carousel.tsx            # Image carousel component
│   ├── chart.tsx               # Chart wrapper component
│   ├── checkbox.tsx            # Checkbox input component
│   ├── collapsible.tsx         # Collapsible content
│   ├── command.tsx             # Command palette component
│   ├── context-menu.tsx        # Context menu component
│   ├── dialog.tsx              # Modal dialog component
│   ├── drawer.tsx              # Slide-out drawer component
│   ├── dropdown-menu.tsx       # Dropdown menu component
│   ├── form.tsx                # Form components with validation
│   ├── hover-card.tsx          # Hover card component
│   ├── input-otp.tsx           # OTP input component
│   ├── input.tsx               # Input field component
│   ├── label.tsx               # Form label component
│   ├── menubar.tsx             # Menu bar component
│   ├── navigation-menu.tsx     # Navigation menu component
│   ├── pagination.tsx          # Pagination component
│   ├── popover.tsx             # Popover component
│   ├── progress.tsx            # Progress bar component
│   ├── radio-group.tsx         # Radio button group
│   ├── resizable.tsx           # Resizable component
│   ├── scroll-area.tsx         # Custom scroll area
│   ├── select.tsx              # Select dropdown component
│   ├── separator.tsx           # Visual separator
│   ├── sheet.tsx               # Sheet component
│   ├── sidebar.tsx             # Sidebar navigation
│   ├── skeleton.tsx            # Loading skeleton component
│   ├── slider.tsx              # Slider input component
│   ├── sonner.tsx              # Toast notification
│   ├── switch.tsx              # Toggle switch component
│   ├── table.tsx               # Data table component
│   ├── tabs.tsx                # Tab navigation component
│   ├── textarea.tsx            # Textarea component
│   ├── toast.tsx               # Toast notification component
│   ├── toaster.tsx             # Toast container
│   ├── toggle-group.tsx        # Toggle button group
│   ├── toggle.tsx              # Toggle button component
│   ├── tooltip.tsx             # Tooltip component
│   ├── use-mobile.tsx          # Mobile detection hook
│   └── use-toast.ts            # Toast hook
├── navigation.tsx              # Main navigation component
├── protected-route.tsx         # Route protection component
├── theme-provider.tsx          # Theme context provider
├── user-dashboard.tsx          # User dashboard component
├── dashboard-stats.tsx         # Dashboard statistics component
├── usage-chart.tsx             # Usage chart component
├── cost-calculator.tsx         # Cost calculation component
├── job-table.tsx               # Print job table component
├── history-table.tsx           # History table component
├── history-filter.tsx          # History filtering component
├── billing-table.tsx           # Billing table component
├── billing-management.tsx      # Billing management component
├── admin-user-table.tsx        # Admin user management table
├── admin-billing-table.tsx     # Admin billing table
├── price-table-manager.tsx     # Price management component
├── printer-status.tsx          # Printer status component
├── searchable-select.tsx       # Searchable select component
└── demo-login.tsx              # Demo login component
```

## Library Directory (`lib/`)
```
lib/
├── auth-context.tsx            # Firebase authentication context
├── data-store.ts               # Data store and state management
├── dummy-database.ts           # Dummy data for development
└── utils.ts                    # Utility functions and helpers
```

## Python Service Directory (`python/`)
```
python/
├── collect.py                  # Main data collection script
├── Dockerfile                  # Docker container configuration
└── requirements.txt            # Python dependencies
```

## Scripts Directory (`scripts/`)
```
scripts/
├── deploy-cloud-run.sh         # Google Cloud Run deployment script
├── setup-cloud-scheduler.sh    # Cloud Scheduler setup script
└── populate-dummy-data.ts      # Dummy data population script
```

## Infrastructure Directory (`infra/`)
```
infra/
├── cloud-scheduler.json        # Cloud Scheduler configuration
└── cloudbuild.yaml             # Google Cloud Build configuration
```

## Public Assets Directory (`public/`)
```
public/
├── placeholder-logo.png        # Application logo placeholder
├── placeholder-logo.svg        # SVG logo placeholder
├── placeholder-user.jpg        # Default user avatar
├── placeholder.jpg             # Generic placeholder image
└── placeholder.svg             # Generic SVG placeholder
```

## Configuration Files

### Frontend Configuration
- **`package.json`**: Node.js dependencies (Next.js, React, TypeScript, Tailwind)
- **`next.config.mjs`**: Next.js build configuration and optimization
- **`tsconfig.json`**: TypeScript compiler configuration
- **`tailwind.config.js`**: Tailwind CSS configuration with custom theme
- **`postcss.config.mjs`**: PostCSS configuration for Tailwind processing
- **`components.json`**: shadcn/ui component configuration
- **`.env.local`**: Environment variables for Firebase configuration

### Backend Configuration
- **`firestore.rules`**: Firebase Firestore security rules
- **`python/requirements.txt`**: Python dependencies for data collection
- **`python/Dockerfile`**: Docker configuration for Cloud Run deployment

## Key File Purposes

### Core Application Files

**`app/layout.tsx`** - Root Layout:
- Global navigation and layout structure
- Authentication context provider
- Theme provider integration
- Global CSS imports

**`app/page.tsx`** - Home Page:
- Landing page with login redirect
- Public access without authentication
- Application overview and branding

**`components/user-dashboard.tsx`** - User Dashboard:
- Personal printing statistics display
- Recent activity overview
- Cost tracking and visualization
- Navigation to other user features

**`components/billing-management.tsx`** - Billing Management:
- Admin billing interface
- Monthly billing generation
- Export functionality
- User billing management

**`lib/auth-context.tsx`** - Authentication Context:
- Firebase authentication integration
- User state management
- Role-based access control
- Session persistence

**`lib/data-store.ts`** - Data Store:
- Firestore data access functions
- Real-time data synchronization
- Data validation and processing
- Error handling and fallbacks

### UI Components

**`components/ui/`** - shadcn/ui Components:
- Reusable UI components built on Radix UI
- Consistent design system
- Accessibility features
- TypeScript support

**`components/navigation.tsx`** - Navigation:
- Role-based navigation menu
- Responsive design
- Active state management
- User profile integration

**`components/cost-calculator.tsx`** - Cost Calculator:
- Real-time cost calculation
- Multiple format support
- Dynamic pricing integration
- User-friendly interface

### Data Collection

**`python/collect.py`** - Data Collection Service:
- Network printer polling
- Job data collection
- Firestore data storage
- Error handling and logging

## Dependencies

### Frontend Dependencies
- **next**: 15.2.4 - React framework with App Router
- **react**: ^19 - React library
- **react-dom**: ^19 - React DOM rendering
- **typescript**: ^5 - TypeScript language
- **tailwindcss**: ^3.3.0 - Utility-first CSS framework
- **@radix-ui/react-***: Various Radix UI components
- **lucide-react**: ^0.454.0 - Icon library
- **recharts**: Data visualization library
- **class-variance-authority**: ^0.7.1 - Component variants
- **clsx**: ^2.1.1 - Conditional CSS classes
- **tailwind-merge**: ^2.5.5 - Tailwind class merging

### Development Dependencies
- **@types/node**: ^22 - Node.js TypeScript types
- **@types/react**: ^19 - React TypeScript types
- **@types/react-dom**: ^19 - React DOM TypeScript types
- **eslint**: ^8 - Code linting
- **eslint-config-next**: 15.1.3 - Next.js ESLint configuration
- **autoprefixer**: ^10.0.1 - CSS vendor prefixing
- **postcss**: ^8.5 - CSS processing
- **tailwindcss-animate**: ^1.0.7 - Tailwind animations

### Python Dependencies
- **requests**: HTTP client for printer API calls
- **firebase-admin**: Firebase Admin SDK
- **google-cloud-firestore**: Firestore client library
- **python-dotenv**: Environment variable management

## Key Features

### Implemented Features
- ✅ **Authentication**: Firebase Authentication with role-based access
- ✅ **User Dashboard**: Personal statistics and activity tracking
- ✅ **Print History**: Comprehensive job history with filtering
- ✅ **Admin Panel**: User management, billing, and system monitoring
- ✅ **Data Collection**: Automated printer data collection service
- ✅ **Cost Calculator**: Real-time cost calculation with dynamic pricing
- ✅ **Data Export**: CSV export functionality for reporting
- ✅ **Responsive Design**: Mobile-first design with cross-device compatibility
- ✅ **Real-time Updates**: Live data synchronization across components
- ✅ **Security**: Firestore security rules and input validation

### File Organization Principles
- **App Router Structure**: Next.js 13+ App Router for modern routing
- **Component Modularity**: Reusable components with clear separation of concerns
- **Type Safety**: Full TypeScript coverage throughout the application
- **Design System**: Consistent UI with shadcn/ui component library
- **Environment Configuration**: Flexible configuration for different deployment environments
- **Error Resilience**: Comprehensive error handling with graceful fallbacks

This streamlined structure focuses on the core printing management functionality while maintaining clean architecture and modern development practices. 