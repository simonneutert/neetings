import { h } from "preact";
import { useTranslation } from "../i18n/index";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

export function Navigation(
  {
    onClearMeeting,
    onGoToIndex,
    onClearAllData,
    hasMeetingSelected,
    onGoToAttendees,
    onGoToFAQ,
    onGoToImprint,
  }: {
    onClearMeeting?: () => void;
    onGoToIndex?: () => void;
    onClearAllData?: () => void;
    hasMeetingSelected?: boolean;
    onGoToAttendees?: () => void;
    onGoToFAQ?: () => void;
    onGoToImprint?: () => void;
  },
) {
  const { t } = useTranslation();
  return (
    <nav class="navbar navbar-expand-lg bg-body-secondary">
      <div class="container-fluid">
        <a
          class="navbar-brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (onGoToIndex) onGoToIndex();
          }}
        >
          {t("navigation.brand")}
        </a>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label={t("navigation.toggleNavigation")}
        >
          <span class="navbar-toggler-icon" />
        </button>
        <div
          class="collapse navbar-collapse"
          id="navbarSupportedContent"
        >
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a
                class="nav-link active"
                aria-current="page"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (onGoToIndex) onGoToIndex();
                }}
              >
                {t("navigation.meetings")}
              </a>
            </li>
            <li class="nav-item">
              <a
                class="nav-link"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (onGoToAttendees) onGoToAttendees();
                }}
              >
                {t("navigation.attendees")}
              </a>
            </li>
            <li class="nav-item">
              <a
                class="nav-link"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (onGoToFAQ) onGoToFAQ();
                }}
              >
                {t("navigation.faq")}
              </a>
            </li>
            <li class="nav-item">
              <a
                class="nav-link"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (onGoToImprint) onGoToImprint();
                }}
              >
                {t("navigation.imprint")}
              </a>
            </li>
            {hasMeetingSelected && (
              <li class="nav-item">
                <button
                  class="nav-link"
                  onClick={() => {
                    if (
                      window.confirm(
                        t("confirmations.clearMeeting"),
                      )
                    ) {
                      if (onClearMeeting) {
                        onClearMeeting();
                      }
                    }
                  }}
                >
                  {t("navigation.clearMeeting")}
                </button>
              </li>
            )}
            <li class="nav-item">
              <button
                class="nav-link text-danger"
                onClick={() => {
                  if (
                    window.confirm(
                      t("confirmations.clearAllData"),
                    )
                  ) {
                    if (onClearAllData) onClearAllData();
                  }
                }}
              >
                {t("navigation.clearAllData")}
              </button>
            </li>
          </ul>
          <div class="d-flex gap-2">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
              <li class="nav-item">
                <a
                  class="nav-link"
                  href="https://github.com/simonneutert/neetings-feedback-public-alpha/discussions"
                >
                  {t("navigation.github_discussion")}
                </a>
              </li>
            </ul>
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
}
