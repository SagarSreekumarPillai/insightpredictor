import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dispatch, SetStateAction } from "react";

interface FileUploaderProps {
  file: File | null;
  setFile: Dispatch<SetStateAction<File | null>>;
  onUpload: () => void;
  buttonClasses: string;
}

export function FileUploader({ file, setFile, onUpload, buttonClasses }: FileUploaderProps) {
  return (
    <div className="space-y-4">
      <Input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <Button onClick={onUpload} className={buttonClasses}>
        Upload CSV
      </Button>
    </div>
  );
}