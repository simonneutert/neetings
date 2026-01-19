import { FunctionalComponent } from "preact";
import { useTranslation } from "../i18n/index";
import { ErrorModal } from "./ErrorModal";
import type {
  ImportProgress,
  PartialImportResult,
} from "../hooks/useImportExport";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importProgress: ImportProgress | null;
  modalError: any;
  modalErrors: any[];
  partialResult: PartialImportResult | null;
  onRetry: () => void;
  onPartialAccept: () => void;
}

export const ImportModal: FunctionalComponent<ImportModalProps> = ({
  isOpen,
  onClose,
  importProgress,
  modalError,
  modalErrors,
  partialResult,
  onRetry,
  onPartialAccept,
}) => {
  const { t } = useTranslation();

  return (
    <ErrorModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("importExport.import")}
      error={modalError}
      errors={modalErrors}
      partialResult={partialResult}
      importProgress={importProgress}
      onRetry={onRetry}
      onPartialAccept={onPartialAccept}
      showTechnicalDetails={false}
    />
  );
};
