import React, { useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSingerAvatarState } from "../../state/singerAvatarState";

interface AvatarUploadProps {
  singerId: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ singerId }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const setAvatar = useSingerAvatarState((s) => s.setAvatar);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const bytes = Array.from(new Uint8Array(arrayBuffer));

    const path = await invoke<string>("save_singer_avatar_cmd", {
      singer_id: singerId,
      data: bytes,
    });

    setAvatar(singerId, path);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        onChange={handleChange}
      />
    </div>
  );
};
