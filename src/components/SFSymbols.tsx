import type { ComponentProps, ComponentType } from 'react';
import {
  ArrowRightCircleIcon,
  CheckIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  EyeSlashIcon,
  FingerPrintIcon,
  GlobeAltIcon,
  KeyIcon,
  MapPinIcon,
  NoSymbolIcon,
  PresentationChartBarIcon,
  ServerStackIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserGroupIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleSolidIcon,
  ExclamationCircleIcon,
  EyeIcon as EyeSolidIcon,
  KeyIcon as KeySolidIcon,
  LockClosedIcon as LockClosedSolidIcon,
  MapIcon as MapSolidIcon,
  ShieldCheckIcon as ShieldCheckSolidIcon,
  TrashIcon as TrashSolidIcon,
  UserCircleIcon as UserCircleSolidIcon,
} from '@heroicons/react/24/solid';

type IconProps = ComponentProps<'svg'> & { size?: number };

type HeroIcon = ComponentType<ComponentProps<'svg'>>;

const createIcon = (Icon: HeroIcon, options?: { solid?: boolean }) => {
  const Wrapped = ({ size, ...rest }: IconProps) => {
    const dimension = size ? { width: size, height: size } : {};
    if (options?.solid) {
      return <Icon {...dimension} {...rest} />;
    }
    return <Icon strokeWidth={1.5} {...dimension} {...rest} />;
  };

  Wrapped.displayName = Icon.displayName ?? 'HeroIcon';
  return Wrapped;
};

export const SFCheckmark = createIcon(CheckIcon);
export const SFCheckmarkCircleFill = createIcon(CheckCircleSolidIcon, { solid: true });
export const SFExclamationTriFill = createIcon(ExclamationCircleIcon, { solid: true });
export const SFEyeCircleFill = createIcon(EyeSolidIcon, { solid: true });
export const SFEyeSlashCircle = createIcon(EyeSlashIcon);
export const SFGlobe = createIcon(GlobeAltIcon);
export const SFLockFill = createIcon(LockClosedSolidIcon, { solid: true });
export const SFMapFill = createIcon(MapSolidIcon, { solid: true });
export const SFMappinCircleFill = createIcon(MapPinIcon);
export const SFNosign = createIcon(NoSymbolIcon);
export const SFPersonBadgePlus = createIcon(UserPlusIcon);
export const SFPersonCircleFill = createIcon(UserCircleSolidIcon, { solid: true });
export const SFRectArrowRight = createIcon(ArrowRightCircleIcon);
export const SFTrash = createIcon(TrashIcon);
export const SFTrashFill = createIcon(TrashSolidIcon, { solid: true });

export const SFShield = createIcon(ShieldCheckIcon);
export const SFShieldFill = createIcon(ShieldCheckSolidIcon, { solid: true });
export const SFKey = createIcon(KeyIcon);
export const SFKeyFill = createIcon(KeySolidIcon, { solid: true });
export const SFFingerprint = createIcon(FingerPrintIcon);
export const SFServer = createIcon(ServerStackIcon);
export const SFDevice = createIcon(DevicePhoneMobileIcon);
export const SFUsage = createIcon(ClockIcon);
export const SFHistory = createIcon(ClockIcon);
export const SFContacts = createIcon(UserGroupIcon);
export const SFDiagnostics = createIcon(PresentationChartBarIcon);
export const SFLocation = SFMappinCircleFill;
