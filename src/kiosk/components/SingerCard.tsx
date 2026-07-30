import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSingerAvatarState } from "../../state/singerAvatarState";
import { useSingerState } from "../../state/singerState";
import { AvatarUpload } from "./AvatarUpload";
import { ETAIndicator } from "./ETAIndicator";

interface SingerCardProps {
  singerId: string;
  name: string;
}

const SingerCard: React.FC<SingerCardProps> = ({ singerId, name }) => {
  const getAvatar = useSingerAvatarState((s) => s.getAvatar);
  const setAvatar = useSingerAvatarState((s) => s.setAvatar);
  const [avatarPath, setAvatarPath] = useState<string | undefined>(
    getAvatar(singerId)
  );

  // ⭐ Pull singer stats from singerState
  const singer = useSingerState(
    (state) => state.singers.find((s) => s.id === singerId)
  );

  useEffect(() => {
    async function loadAvatar() {
      if (avatarPath) return;

      const result = await invoke<null | string>("get_singer_avatar_cmd", {
        singer_id: singerId,
      });

      if (result) {
        setAvatar(singerId, result);
        setAvatarPath(result);
      }
    }

    loadAvatar();
  }, [singerId, avatarPath, setAvatar]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 8,
        borderRadius: 8,
        border: "1px solid #1f2937",
      }}
    >
      {/* ⭐ Avatar */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          overflow: "hidden",
          background: "#111827",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#9ca3af",
          fontSize: 18,
          fontWeight: 600,
        }}
      >
        {avatarPath ? (
          <img
            src={avatarPath}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span>{name.charAt(0).toUpperCase()}</span>
        )}
      </div>

      {/* ⭐ Name + ETA + Stats */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>Singer</div>

        <ETAIndicator singerId={singerId} />

        {singer && (
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            {singer.stats.totalSongsSung} songs sung
          </div>
        )}
      </div>

      {/* ⭐ Upload Button */}
      <AvatarUpload singerId={singerId} />
    </div>
  );
};

export default SingerCard;
