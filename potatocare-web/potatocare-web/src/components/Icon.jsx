// Maps the Ionicons / MaterialIcons / FontAwesome5 names used by the original
// React Native app onto react-icons, so screens keep the same `name="..."` props.
import { IoAlertCircle, IoAlertCircleOutline, IoAnalyticsOutline, IoBook, IoBookOutline, IoCalendarOutline, IoCameraOutline, IoChatbubbleEllipsesOutline, IoCheckmarkCircle, IoChevronBack, IoChevronDownCircle, IoChevronForward, IoChevronUpCircle, IoClose, IoCloseCircle, IoCloud, IoCloudOfflineOutline, IoCloudOutline, IoCloudy, IoCloudyNight, IoDocumentTextOutline, IoEllipse, IoEye, IoEyeOff, IoFlaskOutline, IoHome, IoImagesOutline, IoInformationCircle, IoLeaf, IoLeafOutline, IoLocationOutline, IoLogOutOutline, IoMedicalOutline, IoMedkit, IoMedkitOutline, IoNavigateOutline, IoNotificationsOutline, IoPartlySunny, IoPartlySunnyOutline, IoPersonCircleOutline, IoPersonOutline, IoRainy, IoRainyOutline, IoRefreshOutline, IoSaveOutline, IoScan, IoScanOutline, IoShieldCheckmarkOutline, IoSnow, IoSunny, IoSwapVertical, IoTimeOutline, IoWarning, IoWarningOutline } from "react-icons/io5";
import { MdLocalFlorist, MdPerson } from "react-icons/md";
import { FaFlask, FaLeaf, FaPills } from "react-icons/fa";

const ION = {
  "leaf": IoLeaf,
  "leaf-outline": IoLeafOutline,
  "eye": IoEye,
  "eye-off": IoEyeOff,
  "home": IoHome,
  "cloud": IoCloud,
  "scan": IoScan,
  "medkit": IoMedkit,
  "book": IoBook,
  "ellipse": IoEllipse,
  "person-circle-outline": IoPersonCircleOutline,
  "log-out-outline": IoLogOutOutline,
  "notifications-outline": IoNotificationsOutline,
  "chevron-forward": IoChevronForward,
  "cloud-outline": IoCloudOutline,
  "calendar-outline": IoCalendarOutline,
  "time-outline": IoTimeOutline,
  "cloud-offline-outline": IoCloudOfflineOutline,
  "alert-circle-outline": IoAlertCircleOutline,
  "alert-circle": IoAlertCircle,
  "warning": IoWarning,
  "warning-outline": IoWarningOutline,
  "checkmark-circle": IoCheckmarkCircle,
  "close": IoClose,
  "close-circle": IoCloseCircle,
  "camera-outline": IoCameraOutline,
  "images-outline": IoImagesOutline,
  "scan-outline": IoScanOutline,
  "save-outline": IoSaveOutline,
  "refresh-outline": IoRefreshOutline,
  "medkit-outline": IoMedkitOutline,
  "rainy-outline": IoRainyOutline,
  "swap-vertical": IoSwapVertical,
  "person-outline": IoPersonOutline,
  "medical-outline": IoMedicalOutline,
  "document-text-outline": IoDocumentTextOutline,
  "book-outline": IoBookOutline,
  "analytics-outline": IoAnalyticsOutline,
  "chevron-up-circle": IoChevronUpCircle,
  "chevron-down-circle": IoChevronDownCircle,
  "information-circle": IoInformationCircle,
  "shield-checkmark-outline": IoShieldCheckmarkOutline,
  "flask-outline": IoFlaskOutline,
  "location-outline": IoLocationOutline,
  "navigate-outline": IoNavigateOutline,
  "chatbubble-ellipses-outline": IoChatbubbleEllipsesOutline,
  "partly-sunny-outline": IoPartlySunnyOutline,
  "rainy": IoRainy,
  "cloudy": IoCloudy,
  "sunny": IoSunny,
  "snow": IoSnow,
  "cloudy-night": IoCloudyNight,
  "partly-sunny": IoPartlySunny,
  "chevron-back": IoChevronBack,
};

const MATERIAL = {
  "local-florist": MdLocalFlorist,
  "person": MdPerson,
};

const FA = {
  "pills": FaPills,
  "leaf": FaLeaf,
  "flask": FaFlask,
};

const FAMILIES = { ion: ION, material: MATERIAL, fa: FA };

export default function Icon({ name, size = 24, color = "currentColor", family = "ion", style }) {
  const Cmp = FAMILIES[family]?.[name] || ION.ellipse;
  return <Cmp size={size} color={color} style={{ flexShrink: 0, ...style }} />;
}
