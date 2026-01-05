import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCharacterStore } from '@/stores';
import { Button, Input, TextArea, Avatar } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { PREDEFINED_CHARACTERS } from '@/services/ai';
import type { CharacterTemplate } from '@/types';

export function ContactEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  
  const { getCharacter, createCharacter, updateCharacter } = useCharacterStore();
  
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [persona, setPersona] = useState('');
  const [saving, setSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const applyTemplate = (template: CharacterTemplate) => {
    setName(template.name);
    setAvatar(template.avatar);
    setBio(template.bio);
    setPersona(template.persona);
    setShowTemplates(false);
  };

  useEffect(() => {
    if (!isNew && id) {
      getCharacter(id).then((char) => {
        if (char) {
          setName(char.name);
          setAvatar(char.avatar);
          setBio(char.bio);
          setPersona(char.persona);
        }
      });
    }
  }, [id, isNew, getCharacter]);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setSaving(true);
    try {
      if (isNew) {
        const character = await createCharacter({
          name: name.trim(),
          avatar,
          bio,
          persona
        });
        navigate(`/contacts/${character.id}`);
      } else if (id) {
        await updateCharacter(id, {
          name: name.trim(),
          avatar,
          bio,
          persona
        });
        navigate(`/contacts/${id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-light dark:bg-bg-dark">
      <PageHeader
        title={isNew ? '新建联系人' : '编辑联系人'}
        showBack
        right={
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!name.trim() || saving}
            loading={saving}
          >
            保存
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Quick templates */}
        {isNew && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-purple-900 dark:text-purple-300">✨ 快速创建</span>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-sm text-purple-600 dark:text-purple-400"
              >
                {showTemplates ? '收起' : '选择模板'}
              </button>
            </div>
            {showTemplates && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {PREDEFINED_CHARACTERS.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => applyTemplate(template)}
                    className="text-left p-3 bg-white dark:bg-gray-800 rounded-lg hover:ring-2 hover:ring-purple-500 transition-all"
                  >
                    <p className="font-medium text-gray-900 dark:text-gray-100">{template.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{template.bio}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Avatar preview */}
        <div className="flex justify-center py-4">
          <Avatar src={avatar} name={name || '?'} size="xl" />
        </div>

        <Input
          label="头像URL"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          placeholder="输入头像图片URL（可选）"
        />

        <Input
          label="名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入联系人名称"
          required
        />

        <Input
          label="签名"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="输入签名或简介（可选）"
        />

        <TextArea
          label="人设描述"
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          placeholder="描述这个角色的性格、背景、说话风格等..."
          rows={6}
        />

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm">
          <p className="font-medium text-blue-900 dark:text-blue-300 mb-2">
            💡 人设描述提示
          </p>
          <ul className="text-blue-800 dark:text-blue-400 space-y-1">
            <li>• 描述角色的基本信息（年龄、职业等）</li>
            <li>• 说明角色的性格特点</li>
            <li>• 定义角色的说话风格和口癖</li>
            <li>• 添加角色的背景故事</li>
            <li>• 设定角色与用户的关系</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
