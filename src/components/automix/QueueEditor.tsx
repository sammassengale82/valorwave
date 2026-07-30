import React, { useState } from "react";
import { useAutoMixState } from "../../state/autoMixState";
import "../../styles/queueeditor.css";

export default function QueueEditor() {
  const { queue, setQueue } = useAutoMixState();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
    setDraggedIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexRaw = e.dataTransfer.getData("text/plain");
    setDraggedIndex(null);

    if (!sourceIndexRaw) return;

    const sourceIndex = Number(sourceIndexRaw);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    const newQueue = [...queue];
    const [movedItem] = newQueue.splice(sourceIndex, 1);

    if (movedItem) {
      newQueue.splice(targetIndex, 0, movedItem);
      setQueue(newQueue);
    }
  };

  return (
    <div className="qe-root">
      <h4 className="qe-title">Reorder Queue</h4>

      <ul className="qe-list">
        {queue.map((track, index) => {
          const isDragging = draggedIndex === index;

          return (
            <li
              key={`${track.id}-qe-${index}`}
              className={`qe-item ${isDragging ? "qe-item--dragging" : ""}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragOver={(e) => e.preventDefault()}
              onDragEnd={() => setDraggedIndex(null)}
              title="Drag to reorder track position"
            >
              <span className="qe-index">{index + 1}</span>
              <span className="qe-track-title">{track.title}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
