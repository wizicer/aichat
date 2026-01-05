import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import { useLoreBookStore } from '@/stores';
import { Button, Modal, Input, TextArea, Select } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { PREDEFINED_LORE } from '@/services/ai';
import type { LoreBook as LoreBookType, LoreTemplate } from '@/types';

const CATEGORIES = [
  { value: '世界观', label: '世界观' },
  { value: '人物', label: '人物' },
  { value: '地点', label: '地点' },
  { value: '物品', label: '物品' },
  { value: '事件', label: '事件' },
  { value: '其他', label: '其他' }
];

export function LoreBook() {
  const { entries, loadEntries, createEntry, updateEntry, deleteEntry, toggleEnabled } = useLoreBookStore();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LoreBookType | null>(null);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('世界观');
  const [priority, setPriority] = useState(0);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const applyTemplate = async (template: LoreTemplate) => {
    await createEntry({
      name: template.name,
      content: template.content,
      category: template.category,
      priority: template.priority,
      enabled: true
    });
    setShowTemplates(false);
  };

  const filteredEntries = filterCategory
    ? entries.filter(e => e.category === filterCategory)
    : entries;

  const handleOpenCreate = () => {
    setEditingEntry(null);
    setName('');
    setContent('');
    setCategory('世界观');
    setPriority(0);
    setShowEditModal(true);
  };

  const handleOpenEdit = (entry: LoreBookType) => {
    setEditingEntry(entry);
    setName(entry.name);
    setContent(entry.content);
    setCategory(entry.category);
    setPriority(entry.priority);
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) return;
    
    if (editingEntry) {
      await updateEntry(editingEntry.id, {
        name: name.trim(),
        content: content.trim(),
        category,
        priority
      });
    } else {
      await createEntry({
        name: name.trim(),
        content: content.trim(),
        category,
        priority,
        enabled: true
      });
    }
    
    setShowEditModal(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个条目吗？')) {
      await deleteEntry(id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-light dark:bg-bg-dark">
      <PageHeader
        title="世界书"
        showBack
        right={
          <button
            onClick={handleOpenCreate}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            <Plus size={20} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* Quick templates */}
        <div className="mx-4 mt-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-purple-900 dark:text-purple-300 flex items-center gap-2">
              <Sparkles size={16} /> 快速添加
            </span>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="text-sm text-purple-600 dark:text-purple-400"
            >
              {showTemplates ? '收起' : '展开模板'}
            </button>
          </div>
          {showTemplates && (
            <div className="space-y-2 mt-3">
              {PREDEFINED_LORE.map((template, index) => (
                <button
                  key={index}
                  onClick={() => applyTemplate(template)}
                  className="w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg hover:ring-2 hover:ring-purple-500 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{template.name}</p>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-500">{template.category}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{template.content}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 p-4 overflow-x-auto">
          <button
            onClick={() => setFilterCategory(null)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              filterCategory === null
                ? 'bg-primary text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            全部
          </button>
          {CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterCategory(value)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                filterCategory === value
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Entries list */}
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
            <p className="mb-4">暂无条目</p>
            <Button onClick={handleOpenCreate}>
              创建第一个条目
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className={`bg-white dark:bg-gray-900 px-4 py-3 ${
                  !entry.enabled ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {entry.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                        {entry.category}
                      </span>
                      {entry.priority > 0 && (
                        <span className="text-xs text-orange-500">
                          优先级: {entry.priority}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {entry.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => toggleEnabled(entry.id)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {entry.enabled ? (
                        <ToggleRight size={20} className="text-primary" />
                      ) : (
                        <ToggleLeft size={20} />
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(entry)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 text-gray-500 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={editingEntry ? '编辑条目' : '新建条目'}
      >
        <div className="space-y-4">
          <Input
            label="名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="条目名称"
          />
          <Select
            label="分类"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={CATEGORIES}
          />
          <Input
            label="优先级"
            type="number"
            value={priority.toString()}
            onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
            placeholder="0-100，数字越大优先级越高"
          />
          <TextArea
            label="内容"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="详细描述..."
            rows={4}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !content.trim()}>
            保存
          </Button>
        </div>
      </Modal>
    </div>
  );
}
