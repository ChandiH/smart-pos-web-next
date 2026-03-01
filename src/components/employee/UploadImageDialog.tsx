"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
type UploadImageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File) => Promise<void>;
};
const UploadImageDialog = ({
  open,
  onOpenChange,
  onUpload,
}: UploadImageDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };
  const handleUpload = async () => {
    if (!file) return;
    try {
      setIsUploading(true);
      await onUpload(file);
      setFile(null);
      onOpenChange(false);
    } catch {
      // errors are surfaced via provided callback (toast)
    } finally {
      setIsUploading(false);
    }
  };
  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setFile(null);
    }
    onOpenChange(nextOpen);
  };
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload New Image</DialogTitle>
          <DialogDescription>
            Select a JPG or PNG file to update your profile picture.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">
              Recommended size 400×400px. Max 5MB.
            </p>
          </div>
          <div className="flex items-center justify-center">
            {previewUrl ? (
              <div className="relative h-40 w-40 overflow-hidden rounded-full border">
                <Image
                  src={previewUrl}
                  alt="Selected profile"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/60 bg-muted/30 p-6 text-center">
                <ImageUp className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Choose an image to preview it here.
                </p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? "Uploading…" : "Update Image"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default UploadImageDialog;
