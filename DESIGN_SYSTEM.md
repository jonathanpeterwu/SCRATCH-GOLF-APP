# Golf Coach Design System

Unified style reference for the mobile app UI. Clean, focused, athletic aesthetic with dark-first parity.

---

## Design Principles

1. **Touch-first design** — all interactive elements ≥44px hit target
2. **Content over chrome** — navigation fades, golf data speaks
3. **Consistent rhythm** — spacing, type sizes, and radii follow an 8px/4px grid
4. **Dark-first parity** — every component works flawlessly in both modes
5. **Progressive disclosure** — summary first, expand for detail
6. **Athletic minimalism** — clean like golf course fairways, not busy like a pro shop

---

## Layout

### Navigation Structure

```
┌──────────────────────────────────────┐
│  Bottom Tab Bar (height: 64px)      │
│  ┌────┬────┬────┬────┐              │
│  │ ⛳ │ 💬 │ 📊 │ 👤 │              │
│  │Bag │Chat│Stat│Prof│              │
│  └────┴────┴────┴────┘              │
│                                      │
│  Screen Content Area                │
│  ┌────────────────────────────────┐ │
│  │ Header (h-14, 56px)            │ │
│  │ ┌──────────────────────┐       │ │
│  │ │ Title + Actions      │       │ │
│  │ └──────────────────────┘       │ │
│  │                                │ │
│  │ ScrollView Content             │ │
│  │ ┌──────────────────────┐       │ │
│  │ │ Cards, Lists, Forms  │       │ │
│  │ │ p-4 spacing          │       │ │
│  │ └──────────────────────┘       │ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
```

| Token | Value | Notes |
|-------|-------|-------|
| Screen padding | `p-4` (16px) | Standard horizontal padding |
| Header height | `h-14` (56px) | Fixed, consistent across screens |
| Tab bar height | `h-16` (64px) | iOS-safe bottom navigation |
| Card gap | `gap-3` (12px) | Between cards in vertical lists |
| Section gap | `space-y-6` (24px) | Between major sections |
| Safe area insets | Auto-handled | Platform StatusBar component |

---

## Typography

### Font Stack

```javascript
fontFamily: {
  sans: ['-apple-system', 'SF Pro Display', 'Roboto', 'Helvetica Neue', 'sans-serif'],
  mono: ['SF Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
}
```

### Type Scale

| Role | Class | Size | Weight | Usage |
|------|-------|------|--------|-------|
| **Screen title** | `text-3xl font-bold` | 30px | 700 | Profile name, welcome screens |
| **Page title** | `text-2xl font-bold` | 24px | 700 | Section headers (My Golf Bag) |
| **Section title** | `text-xl font-semibold` | 20px | 600 | Card titles, modal titles |
| **Subsection** | `text-lg font-semibold` | 18px | 600 | Club section headers |
| **Body large** | `text-base font-medium` | 16px | 500 | Primary buttons, important text |
| **Body** | `text-base` | 16px | 400 | Default body text, inputs |
| **Body small** | `text-sm` | 14px | 400 | Descriptions, secondary info |
| **Caption** | `text-sm font-medium` | 14px | 500 | Labels, metadata |
| **Micro** | `text-xs` | 12px | 400 | Timestamps, fine print |
| **Badge** | `text-xs font-semibold uppercase` | 12px | 600 | Status badges, tags |

### Typography Rules

- **No sub-16px body text** on mobile (WCAG AA compliance)
- **Tabular nums** (`font-variant-numeric: tabular-nums`) on all stats
- **Monospace** for: timestamps, score differentials, exact measurements
- **Line height**: 1.5 for body, 1.2 for headings
- **Letter spacing**: `-0.02em` on headlines (tracking-tight)

---

## Spacing

Based on 8px/4px grid. Mobile-optimized touch targets.

| Use | Value | Token |
|-----|-------|-------|
| **Inline icon gap** | 8px | `gap-2` |
| **Button padding** | 12px × 16px | `px-4 py-3` |
| **Card padding** | 16px | `p-4` |
| **Section gap** | 24px | `space-y-6` |
| **Screen padding** | 16px | `p-4` |
| **Between stat cards** | 12px | `gap-3` |
| **List item padding** | 16px × 12px | `px-4 py-3` |
| **Floating button bottom** | 20px | `bottom-5` |
| **Modal padding** | 24px | `p-6` |

### Touch Targets

- **Minimum**: 44×44px (iOS HIG / Material Design)
- **Buttons**: 48px height minimum
- **List items**: 56px height minimum
- **Tab bar items**: 64px height
- **Floating action button**: 56×56px

---

## Color System

### Brand Colors

```javascript
brand: {
  light: '#2e7d32',  // Green 800 - light mode primary
  dark: '#4caf50',   // Green 500 - dark mode primary (higher contrast)
}
```

### Core Palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| **background** | `#f5f5f5` | `#121212` | Screen background |
| **surface** | `#ffffff` | `#1e1e1e` | Cards, modals, inputs |
| **surfaceAlt** | `#f9f9f9` | `#252525` | Hover, pressed states |
| **text** | `#333333` | `#e0e0e0` | Primary text |
| **textSecondary** | `#666666` | `#a0a0a0` | Body, descriptions |
| **textTertiary** | `#999999` | `#707070` | Captions, placeholders |
| **border** | `#e0e0e0` | `#333333` | Card borders, dividers |
| **borderLight** | `#f0f0f0` | `#2a2a2a` | Subtle dividers |
| **primary** | `#2e7d32` | `#4caf50` | CTA, links, active states |
| **primaryLight** | `#f1f8f4` | `#1b3a1d` | Selected backgrounds |

### Semantic Colors

| Status | Light BG | Light Text | Dark BG | Dark Text | Usage |
|--------|----------|------------|---------|-----------|-------|
| **Success** | `#e8f5e9` | `#2e7d32` | `#1b3a1d` | `#4caf50` | Good shots, achievements |
| **Warning** | `#fff3e0` | `#e65100` | `#3e2723` | `#ff9800` | Inconsistency alerts |
| **Error** | `#ffebee` | `#c62828` | `#3a1a1a` | `#ef5350` | Bad strokes, errors |
| **Info** | `#e3f2fd` | `#1565c0` | `#1a2a3a` | `#42a5f5` | Tips, insights |
| **Neutral** | `#f5f5f5` | `#616161` | `#2a2a2a` | `#9e9e9e` | Metadata |

### Strokes Gained Colors

```javascript
sgColors: {
  positive: '#4caf50',  // Green - gaining strokes
  neutral: '#ed6c02',   // Orange - near scratch
  negative: '#ef5350',  // Red - losing strokes
}
```

### Coaching Mode Colors

```javascript
modeColors: {
  general: '#1976d2',      // Blue - General coaching
  technical: '#7b1fa2',    // Purple - Technical/Swing
  strategic: '#d84315',    // Deep Orange - Course strategy
  mental: '#00897b',       // Teal - Mental game
  practice: '#f57c00',     // Orange - Practice plans
}
```

---

## Components

### Headers

**Screen Header** (56px fixed height)

```jsx
<View style={{
  height: 56,
  paddingHorizontal: 16,
  backgroundColor: surface,
  borderBottomWidth: 1,
  borderBottomColor: border,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
  <Text style={{ fontSize: 24, fontWeight: 'bold', color: primary }}>
    Title
  </Text>
  <TouchableOpacity>Action</TouchableOpacity>
</View>
```

### Cards

| Variant | Classes | Shadow | Usage |
|---------|---------|--------|-------|
| **Default** | `rounded-xl bg-surface p-4` | Soft | Stat cards, club items |
| **Interactive** | `+ press state` | Lifted on press | Tappable cards |
| **Outlined** | `+ border border-[border]` | None | Secondary cards |
| **Elevated** | `+ shadow-md` | Medium | Modals, important cards |

**Card Sizes**

```javascript
padding: {
  compact: 12,   // p-3 - tight lists
  default: 16,   // p-4 - standard cards
  spacious: 24,  // p-6 - feature cards, modals
}

borderRadius: {
  card: 12,      // rounded-xl
  input: 8,      // rounded-lg
  button: 8,     // rounded-lg
  badge: 999,    // rounded-full
}
```

### Buttons

| Variant | Style | Usage |
|---------|-------|-------|
| **Primary** | `bg-primary text-white h-12 rounded-lg px-6` | Main actions |
| **Secondary** | `bg-surface border border-[border] text-[text] h-12` | Cancel, secondary |
| **Ghost** | `bg-transparent text-primary h-12` | Tertiary actions |
| **Icon** | `h-10 w-10 rounded-full bg-surfaceAlt` | Small actions |
| **Floating** | `h-14 w-14 rounded-full bg-primary shadow-lg` | FAB |

**Button States**

```javascript
states: {
  default: 'opacity-100',
  pressed: 'opacity-70 scale-95',  // activeOpacity={0.7}
  disabled: 'opacity-40',
  loading: '+ <ActivityIndicator />',
}
```

### Inputs

**Text Input**

```jsx
<TextInput
  style={{
    height: 48,
    borderWidth: 1,
    borderColor: inputBorder,
    backgroundColor: inputBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: inputText,
  }}
  placeholderTextColor={placeholder}
/>
```

**Input Variants**

- **Default**: Light border, white/dark surface background
- **Error**: Red border (`borderColor: dangerText`)
- **Success**: Green border (`borderColor: primary`)
- **Disabled**: Reduced opacity, non-editable

### Badges & Pills

```jsx
// Status Badge
<View style={{
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 999,
  backgroundColor: successBg,
}}>
  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: successText, marginRight: 4 }} />
  <Text style={{ fontSize: 12, fontWeight: '600', color: successText }}>
    ACTIVE
  </Text>
</View>
```

### Lists

**List Item** (56px minimum height)

```jsx
<TouchableOpacity style={{
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 12,
  minHeight: 56,
  borderBottomWidth: 1,
  borderBottomColor: borderLight,
}}>
  <Text style={{ fontSize: 24, marginRight: 12 }}>🏌️</Text>
  <View style={{ flex: 1 }}>
    <Text style={{ fontSize: 16, fontWeight: '500', color: text }}>
      Title
    </Text>
    <Text style={{ fontSize: 14, color: textSecondary }}>
      Subtitle
    </Text>
  </View>
  <Text style={{ fontSize: 28, color: textTertiary }}>›</Text>
</TouchableOpacity>
```

### Modals

**Full-Screen Modal** (iOS-style bottom sheet)

```jsx
<Modal animationType="slide" transparent>
  <View style={{ flex: 1, backgroundColor: modalOverlay }}>
    <View style={{
      flex: 1,
      backgroundColor: modalBackground,
      marginTop: 64,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 24,
    }}>
      {/* Modal content */}
    </View>
  </View>
</Modal>
```

### Empty States

```jsx
<View style={{
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingVertical: 80
}}>
  <View style={{
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  }}>
    <Text style={{ fontSize: 32 }}>⛳</Text>
  </View>
  <Text style={{ fontSize: 16, fontWeight: '600', color: text }}>
    No clubs added
  </Text>
  <Text style={{
    fontSize: 14,
    color: textSecondary,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  }}>
    Tap the + button to add clubs to your bag
  </Text>
</View>
```

### Tab Bar

```jsx
<Tab.Navigator
  screenOptions={{
    tabBarActiveTintColor: primary,
    tabBarInactiveTintColor: textTertiary,
    tabBarStyle: {
      height: 64,
      backgroundColor: tabBar,
      borderTopColor: tabBarBorder,
      paddingBottom: 8,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '600',
    },
  }}
/>
```

---

## Shadows & Elevation

| Token | iOS Shadow | Android Elevation | Usage |
|-------|-----------|-------------------|-------|
| **soft** | `shadowRadius: 2, shadowOpacity: 0.1` | `elevation: 2` | Cards at rest |
| **medium** | `shadowRadius: 4, shadowOpacity: 0.15` | `elevation: 4` | Interactive cards |
| **lifted** | `shadowRadius: 8, shadowOpacity: 0.2` | `elevation: 8` | Modals, FAB |
| **floating** | `shadowRadius: 12, shadowOpacity: 0.25` | `elevation: 12` | Floating action button |

**Platform-Specific Shadows**

```javascript
shadow: Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  android: {
    elevation: 4,
  },
})
```

---

## Animations

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| **fade-in** | 200ms | `ease-out` | General appearance |
| **slide-up** | 300ms | `spring` | Modals entering |
| **scale** | 150ms | `ease-in-out` | Button press |
| **opacity** | 200ms | `linear` | activeOpacity transitions |
| **spring** | — | `useNativeDriver: true` | Interactive feedback |

**React Native Animated API**

```javascript
// Fade in
Animated.timing(opacity, {
  toValue: 1,
  duration: 200,
  useNativeDriver: true,
}).start();

// Spring scale
Animated.spring(scale, {
  toValue: 0.95,
  friction: 3,
  useNativeDriver: true,
}).start();
```

---

## Icons & Emojis

### System

- **Platform icons**: React Navigation built-in icons
- **Custom needs**: react-native-vector-icons (Ionicons)
- **Size standard**: 24×24px (`{ fontSize: 24 }`)
- **Button icons**: 20×20px
- **Tab bar icons**: 24×24px

### Emoji Usage

| Context | Emoji | Color |
|---------|-------|-------|
| Driver | 🏌️ | — |
| Woods | 🌲 | — |
| Hybrids | ⚡ | — |
| Irons | 🔨 | — |
| Wedges | 🎯 | — |
| Putter | ⛳ | — |
| Stats | 📊 | — |
| Chat | 💬 | — |
| Profile | 👤 | — |
| Success | ✓ | Green |
| Warning | ⚠️ | Orange |
| Error | ✕ | Red |

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| **Phone (< 380px)** | Compact spacing, 1-column grids |
| **Phone (380-428px)** | Standard spacing, 1-column grids |
| **Tablet (> 428px)** | 2-column stat grids, wider modals |

**Safe Areas**

```jsx
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView style={{ flex: 1 }}>
  {/* Content */}
</SafeAreaView>
```

---

## Accessibility

### Touch Targets

- **Minimum**: 44×44px (iOS) / 48×48px (Android)
- **Recommended**: 48×48px universal minimum
- **Buttons**: 48px height minimum
- **List items**: 56px minimum

### Text Contrast

- **Body on light**: 4.5:1 minimum (WCAG AA)
- **Body on dark**: 4.5:1 minimum
- **Large text**: 3:1 minimum
- **Disabled**: 2.5:1 minimum

### Screen Reader Support

```jsx
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Add driver to golf bag"
  accessibilityRole="button"
  accessibilityHint="Opens a form to add driver details"
>
  <Text>Add Driver</Text>
</TouchableOpacity>
```

---

## File Structure

```
src/
├── theme.js                    # Color palette, useTheme hook
├── store/
│   └── appStore.js            # Zustand state (includes isDarkMode)
├── screens/
│   ├── LoginScreen.js         # Entry point
│   ├── GolfBagScreen.js       # Club management
│   ├── ChatScreen.js          # AI coach chat
│   ├── StatsScreen.js         # GHIN stats
│   └── ProfileScreen.js       # Settings, theme toggle
├── components/                 # (Future) Shared components
│   ├── Button.js
│   ├── Card.js
│   └── Badge.js
└── services/
    ├── auth.js                # Apple Sign-In
    ├── storage.js             # iCloud persistence
    └── aiChat.js              # Claude API integration
```

---

## Anti-Patterns

### ❌ Avoid

- **Text below 14px** (except micro labels 12px)
- **Touch targets < 44px**
- **Hardcoded colors** — always use `useTheme()` hook
- **Platform-specific code** without fallbacks
- **Deep component nesting** (> 4 levels)
- **Inline styles for theming** — use theme tokens
- **Non-semantic color names** (avoid "redButton", use "dangerButton")
- **Fixed pixel widths** — use flex: 1 and percentages

### ✅ Do

- **Use theme tokens** from `useTheme()` for all colors
- **Semantic naming** (primary, surface, danger, not blue, white, red)
- **TouchableOpacity** with `activeOpacity={0.7}` for press feedback
- **Platform-aware components** (`Platform.select()`)
- **Haptic feedback** on important actions (react-native-haptic-feedback)
- **Optimistic UI** updates before API responses
- **Native driver** for animations (`useNativeDriver: true`)

---

## Performance

### Optimization Checklist

- ✅ **FlatList** for long lists (> 10 items), not ScrollView
- ✅ **keyExtractor** on all lists
- ✅ **getItemLayout** for fixed-height list items
- ✅ **removeClippedSubviews** on Android long lists
- ✅ **useNativeDriver: true** on all animations
- ✅ **Memoization** for expensive renders (React.memo, useMemo)
- ✅ **Image optimization** — use proper sizes, caching
- ✅ **Lazy loading** modals and heavy screens

---

## Platform Considerations

### iOS-Specific

- **Safe area insets** mandatory (notch, home indicator)
- **Haptic feedback** on important actions
- **Swipe back** gesture supported
- **Large titles** optional for main screens

### Android-Specific

- **Material elevation** for shadows
- **Ripple effect** on TouchableNativeFeedback
- **Hardware back button** handling
- **StatusBar** theming (light/dark content)

### Web-Specific

- **Hover states** — only show on non-touch devices
- **Keyboard navigation** — focus rings required
- **Responsive breakpoints** — tablet/desktop layouts
- **No native features** — Apple Sign-In, haptics disabled

---

## References

- **Color palette**: `src/theme.js`
- **React Native docs**: https://reactnavigation.org/
- **iOS HIG**: https://developer.apple.com/design/human-interface-guidelines/
- **Material Design**: https://m3.material.io/

---

**Last updated**: 2026-03-08
**Version**: 1.0.0
**Platform**: React Native (iOS, Android, Web)
