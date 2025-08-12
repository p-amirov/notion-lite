import React, { useState, useEffect } from 'react';

// Notion-like single-file React component
export default function App() {
  const [pages, setPages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('notionlite_pages')) || [
        { id: Date.now().toString(), title: 'Новая страница', blocks: [{ id: 'b1', type: 'h1', text: 'Добро пожаловать в Notion-lite' }] }
      ];
    } catch (e) {
      return [];
    }
  });
  const [activeId, setActiveId] = useState(pages[0]?.id || null);

  useEffect(() => {
    localStorage.setItem('notionlite_pages', JSON.stringify(pages));
    if (!activeId && pages.length) setActiveId(pages[0].id);
  }, [pages, activeId]);

  function createPage() {
    const p = { id: Date.now().toString(), title: 'Новая страница', blocks: [{ id: 'b' + Date.now(), type: 'p', text: 'Пустая страница' }] };
    setPages(prev => [p, ...prev]);
    setActiveId(p.id);
  }

  function deletePage(id) {
    const next = pages.filter(p => p.id !== id);
    setPages(next);
    if (activeId === id) setActiveId(next[0]?.id || null);
  }

  function renamePage(id, title) {
    setPages(prev => prev.map(p => p.id === id ? { ...p, title } : p));
  }

  function updateBlock(pageId, blockId, patch) {
    setPages(prev => prev.map(p => {
      if (p.id !== pageId) return p;
      return { ...p, blocks: p.blocks.map(b => b.id === blockId ? { ...b, ...patch } : b) };
    }));
  }

  function addBlock(pageId, type = 'p') {
    const block = { id: 'b' + Date.now(), type, text: type === 'todo' ? '☐ Задача' : 'Новый блок' };
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, blocks: [...p.blocks, block] } : p));
  }

  function moveBlock(pageId, idx, dir) {
    setPages(prev => prev.map(p => {
      if (p.id !== pageId) return p;
      const arr = [...p.blocks];
      const ni = idx + dir;
      if (ni < 0 || ni >= arr.length) return p;
      const [item] = arr.splice(idx, 1);
      arr.splice(ni, 0, item);
      return { ...p, blocks: arr };
    }));
  }

  function deleteBlock(pageId, blockId) {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, blocks: p.blocks.filter(b => b.id !== blockId) } : p));
  }

  const active = pages.find(p => p.id === activeId) || null;

  return (
    <div className="h-screen flex bg-gray-50 text-gray-900">
      <aside className="w-64 p-4 border-r border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Notion-lite</h2>
          <button onClick={createPage} className="px-2 py-1 text-sm rounded bg-indigo-600 text-white">Новая</button>
        </div>
        <div className="space-y-2 overflow-auto" style={{maxHeight: 'calc(100vh - 120px)'}}>
          {pages.map(p => (
            <div key={p.id} className={`p-2 rounded cursor-pointer ${p.id === activeId ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50'}`} onClick={() => setActiveId(p.id)}>
              <div className="flex items-center justify-between">
                <input
                  value={p.title}
                  onChange={e => renamePage(p.id, e.target.value)}
                  className="bg-transparent text-sm font-medium w-full outline-none"
                />
              <div className="flex items-center gap-1 ml-2">
                <button title="Удалить" onClick={(e) => { e.stopPropagation(); deletePage(p.id); }} className="text-xs px-2 py-1 rounded hover:bg-red-50">✕</button>
              </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-4">Сохранено в localStorage. Откройте меню «Новая» для создания страницы.</div>
      </aside>

      <main className="flex-1 p-6">
        {!active ? (
          <div className="flex items-center justify-center h-full text-gray-500">Создайте или выберите страницу слева</div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold">{active.title}</h1>
              <div className="flex items-center gap-2">
                <button onClick={() => addBlock(active.id, 'h1')} className="px-3 py-1 rounded border">H1</button>
                <button onClick={() => addBlock(active.id, 'p')} className="px-3 py-1 rounded border">P</button>
                <button onClick={() => addBlock(active.id, 'todo')} className="px-3 py-1 rounded border">Todo</button>
              </div>
            </div>

            <div className="space-y-4">
              {active.blocks.map((b, idx) => (
                <div key={b.id} className="p-3 bg-white rounded shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-start gap-1">
                      <button onClick={() => moveBlock(active.id, idx, -1)} className="text-xs px-2 py-1 rounded hover:bg-gray-100">↑</button>
                      <button onClick={() => moveBlock(active.id, idx, 1)} className="text-xs px-2 py-1 rounded hover:bg-gray-100">↓</button>
                    </div>
                    <div className="flex-1">
                      {b.type === 'h1' && (
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => updateBlock(active.id, b.id, { text: e.target.textContent })}
                          className="text-xl font-semibold outline-none"
                        >
                          {b.text}
                        </div>
                      )}

                      {b.type === 'p' && (
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => updateBlock(active.id, b.id, { text: e.target.textContent })}
                          className="prose prose-sm outline-none"
                        >
                          {b.text}
                        </div>
                      )}

                      {b.type === 'todo' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            onChange={e => updateBlock(active.id, b.id, { text: (e.target.checked ? '☑' : '☐') + ' ' + (b.text.replace(/^☐ |^☑ /, '')) })}
                            checked={b.text.startsWith('☑')}
                          />
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={e => updateBlock(active.id, b.id, { text: (b.text.startsWith('☑') ? '☑ ' : '☐ ') + e.target.textContent })}
                            className="outline-none"
                          >
                            {b.text.replace(/^☐ |^☑ /, '')}
                          </div>
                        </div>
                      )}

                      <div className="mt-2 text-right">
                        <button onClick={() => deleteBlock(active.id, b.id)} className="text-xs px-2 py-1 rounded hover:bg-red-50">Удалить</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
