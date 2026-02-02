import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SortableStopItemProps {
  id: string;
  index: number;
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
}

function SortableStopItem({ id, index, value, onChange, onRemove }: SortableStopItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex gap-2 items-center ${isDragging ? 'opacity-50' : ''}`}
    >
      <button
        type="button"
        className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-sm text-muted-foreground w-12">Stop {index + 1}</span>
      <Input
        placeholder={`Enter stop ${index + 1} location`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface SortableStopsProps {
  stops: string[];
  onStopsChange: (stops: string[]) => void;
}

export function SortableStops({ stops, onStopsChange }: SortableStopsProps) {
  // Generate stable IDs for each stop
  const [stopIds] = useState<string[]>(() => 
    stops.map((_, i) => `stop-${i}-${Date.now()}`)
  );

  // Keep IDs in sync with stops array length
  const getStopIds = () => {
    while (stopIds.length < stops.length) {
      stopIds.push(`stop-${stopIds.length}-${Date.now()}`);
    }
    return stopIds.slice(0, stops.length);
  };

  const currentIds = getStopIds();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addStop = () => {
    stopIds.push(`stop-${stopIds.length}-${Date.now()}`);
    onStopsChange([...stops, '']);
  };

  const removeStop = (index: number) => {
    stopIds.splice(index, 1);
    onStopsChange(stops.filter((_, i) => i !== index));
  };

  const updateStop = (index: number, value: string) => {
    const updated = [...stops];
    updated[index] = value;
    onStopsChange(updated);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = currentIds.indexOf(active.id as string);
      const newIndex = currentIds.indexOf(over.id as string);
      
      // Reorder both IDs and stops
      const newIds = arrayMove(currentIds, oldIndex, newIndex);
      const newStops = arrayMove(stops, oldIndex, newIndex);
      
      // Update the stopIds array in place
      stopIds.length = 0;
      stopIds.push(...newIds);
      
      onStopsChange(newStops);
    }
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Intermediate Stops</h4>
        <Button type="button" variant="outline" size="sm" onClick={addStop}>
          <Plus className="h-4 w-4 mr-1" />
          Add Stop
        </Button>
      </div>
      {stops.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No intermediate stops added. Click "Add Stop" to add locations between pickup and final destination.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={currentIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {stops.map((stop, index) => (
                <SortableStopItem
                  key={currentIds[index]}
                  id={currentIds[index]}
                  index={index}
                  value={stop}
                  onChange={(value) => updateStop(index, value)}
                  onRemove={() => removeStop(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      {stops.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Drag the grip handle to reorder stops
        </p>
      )}
    </div>
  );
}
