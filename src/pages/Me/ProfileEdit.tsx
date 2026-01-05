import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores';
import { Button, Input, Avatar } from '@/components/ui';
import { PageHeader } from '@/components/layout';

export function ProfileEdit() {
  const navigate = useNavigate();
  const { profile, loadProfile, updateProfile } = useUserStore();
  
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setAvatar(profile.avatar);
      setBio(profile.bio);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim() || '我',
        avatar,
        bio
      });
      navigate('/me');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-light dark:bg-bg-dark">
      <PageHeader
        title="编辑资料"
        showBack
        right={
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            loading={saving}
          >
            保存
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Avatar preview */}
        <div className="flex justify-center py-4">
          <Avatar src={avatar} name={name || '我'} size="xl" />
        </div>

        <Input
          label="头像URL"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          placeholder="输入头像图片URL（可选）"
        />

        <Input
          label="昵称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入昵称"
        />

        <Input
          label="签名"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="输入个人签名（可选）"
        />
      </div>
    </div>
  );
}
