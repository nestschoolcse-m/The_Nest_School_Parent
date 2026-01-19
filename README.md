# NEST ERP Parent App

A mobile application for parents to view their child's school details and receive real-time attendance notifications.

## Features

- 🔐 **Secure Login** - USN-based authentication with password change on first login
- 👨‍👩‍👧 **Student Details** - View student information (name, grade, DOB, parent contacts)
- 📅 **Attendance Tracking** - Real-time attendance history (Entry, Exit, Sports)
- 🔔 **Push Notifications** - Instant alerts when student checks in/out

## Tech Stack

- **Frontend**: Expo (React Native) with TypeScript
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Backend**: Firebase (Firestore, Cloud Functions, FCM)
- **Navigation**: Expo Router

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (for testing)

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

### Running on Device

1. Install **Expo Go** on your phone
2. Scan the QR code from the terminal
3. The app will load on your device

## Firebase Setup

### Two Firebase Projects

1. **nest-school-barcode-ims** - Contains students and attendance data
2. **nest-erp-app** - Parent credentials and FCM tokens

### Cloud Functions Deployment

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize functions
cd firebase-functions
firebase init functions

# Deploy
firebase deploy --only functions
```

## Authentication

- **Username**: Student USN (e.g., NG823004)
- **Default Password**: parent@123
- First login requires password change

## Project Structure

```
Nest_ERP_APP/
├── app/
│   ├── (auth)/          # Login & password change
│   ├── (tabs)/          # Main app tabs
│   ├── _layout.tsx      # Root layout
│   └── index.tsx        # Entry point
├── components/          # Reusable UI components
├── contexts/            # React Context providers
├── hooks/               # Custom React hooks
├── lib/                 # Firebase & utilities
└── firebase-functions/  # Cloud Functions source
```

## License

Private - All rights reserved
