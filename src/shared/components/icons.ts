import type { LucideIcon } from 'lucide-react-native';

import ArrowLeft from 'lucide-react-native/dist/cjs/icons/arrow-left.js';
import CalendarClock from 'lucide-react-native/dist/cjs/icons/calendar-clock.js';
import ChevronRight from 'lucide-react-native/dist/cjs/icons/chevron-right.js';
import Cigarette from 'lucide-react-native/dist/cjs/icons/cigarette.js';
import Clock3 from 'lucide-react-native/dist/cjs/icons/clock-3.js';
import House from 'lucide-react-native/dist/cjs/icons/house.js';
import Minus from 'lucide-react-native/dist/cjs/icons/minus.js';
import Package from 'lucide-react-native/dist/cjs/icons/package.js';
import Plus from 'lucide-react-native/dist/cjs/icons/plus.js';
import Sparkles from 'lucide-react-native/dist/cjs/icons/sparkles.js';
import Trophy from 'lucide-react-native/dist/cjs/icons/trophy.js';
import Users from 'lucide-react-native/dist/cjs/icons/users.js';
import Wallet from 'lucide-react-native/dist/cjs/icons/wallet.js';
import Wind from 'lucide-react-native/dist/cjs/icons/wind.js';

// The project disables package exports and excludes .mjs from Metro resolution,
// so lucide's `react-native` entry cannot be imported from the package root.
// These deep CJS imports keep the icon set tree-limited and Metro-compatible.
export {
  ArrowLeft,
  CalendarClock,
  ChevronRight,
  Cigarette,
  Clock3,
  House,
  Minus,
  Package,
  Plus,
  Sparkles,
  Trophy,
  Users,
  Wallet,
  Wind,
};

export type { LucideIcon };
