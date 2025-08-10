'use client'

import { useState, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { toast } from 'sonner'
import SmartIcon from '@/components/smart-icon'

type Item = {
  id: string
  title?: string
  href?: string
  description?: string
  icon?: string
  enabled?: boolean
}

export default function ItemsSortableList({
  groupId,
  items,
}: {
  groupId: string
  items: Item[]
}) {
  const [list, setList] = useState<Item[]>(items ?? [])
  const order = useMemo(() => list.map(i => String(i.id)), [list])

  function onDragEnd(result: DropResult) {
    const { destination, source } = result
    if (!destination) return
    if (destination.index === source.index && destination.droppableId === source.droppableId) return
    const next = Array.from(list)
    const [moved] = next.splice(source.index, 1)
    next.splice(destination.index, 0, moved)
    setList(next)
  }

  async function save() {
    const res = await fetch('/api/admin/navigation/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, order }),
    })
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: '保存失败' }))
      toast.error(error || '保存失败')
      return
    }
    toast.success('已保存排序')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">拖拽左侧把手调整顺序</p>
        <button
          onClick={save}
          className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm"
        >
          保存排序
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="items">
          {(provided) => (
            <ul ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {list.map((it, idx) => (
                <Draggable key={String(it.id)} draggableId={String(it.id)} index={idx}>
                  {(p, snapshot) => (
                    <li
                      ref={p.innerRef}
                      {...p.draggableProps}
                      className={`flex items-center gap-3 rounded-lg border p-2 bg-card ${snapshot.isDragging ? 'opacity-80 shadow' : ''}`}
                    >
                      <div
                        {...p.dragHandleProps}
                        className="cursor-grab select-none px-2 text-muted-foreground"
                        title="拖拽排序"
                      >
                        ☰
                      </div>

                      <SmartIcon icon={it.icon} size={16} className="w-4 h-4 object-contain" />

                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{it.title || '(未命名)'}</div>
                        {it.href && (
                          <div className="text-xs text-muted-foreground truncate">{it.href}</div>
                        )}
                      </div>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
