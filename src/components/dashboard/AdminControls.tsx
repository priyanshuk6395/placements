"use client";
import { useRouter } from 'next/navigation';
import FileUpload from './FileUpload';
import EntryDrawer from './EntryDrawer';

export default function AdminControls() {
  const router = useRouter();
  return (
    <div className="space-y-4">
      <FileUpload onUploadSuccess={() => router.refresh()} />
      <EntryDrawer />
    </div>
  );
}