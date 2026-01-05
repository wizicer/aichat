import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRealityStore, useChatStore, useCharacterStore, useSettingsStore, useLoreBookStore } from '@/stores';
import { Button } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { aiService } from '@/services/ai';

export function RealityDetail() {
  const { id, rid } = useParams<{ id: string; rid: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { currentReality, loadReality, selectChoice, addParagraph, acceptReality, rejectReality, endReality } = useRealityStore();
  const { currentChat, loadChat } = useChatStore();
  const { getCharacter } = useCharacterStore();
  const { settings, loadSettings } = useSettingsStore();
  const { entries: loreBooks, loadEntries: loadLoreBooks } = useLoreBookStore();

  useEffect(() => {
    if (rid) {
      loadReality(rid);
    }
    if (id) {
      loadChat(id);
    }
    loadSettings();
    loadLoreBooks();
  }, [rid, id, loadReality, loadChat, loadSettings, loadLoreBooks]);

  const handleAccept = async () => {
    if (!rid) return;
    await acceptReality(rid);
  };

  const handleReject = async () => {
    if (!rid) return;
    await rejectReality(rid);
    navigate(-1);
  };

  const handleChoice = async (choiceId: string, choiceLabel: string) => {
    if (!currentReality || !currentChat || !settings || loading) return;

    const lastParagraph = currentReality.paragraphs[currentReality.paragraphs.length - 1];
    if (!lastParagraph) return;

    setLoading(true);
    setError(null);

    try {
      // Mark the choice
      await selectChoice(lastParagraph.id, choiceId);

      // Get character
      const character = await getCharacter(currentChat.characterId);
      if (!character) throw new Error('角色不存在');

      // Build paragraph history
      const paragraphHistory = currentReality.paragraphs.map(p => ({
        content: p.content,
        chosenLabel: p.choices?.find(c => c.id === p.chosenId)?.label
      }));
      paragraphHistory[paragraphHistory.length - 1].chosenLabel = choiceLabel;

      // Continue reality
      const response = await aiService.continueReality(
        settings,
        character,
        currentReality.title,
        paragraphHistory,
        loreBooks
      );

      if (response.type === 'reality') {
        // Add new paragraph
        await addParagraph({
          id: crypto.randomUUID(),
          content: response.paragraph,
          choices: response.choices?.length ? response.choices : undefined
        });

        // If no choices, end the reality
        if (!response.choices?.length) {
          await endReality();
        }
      } else {
        // Unexpected response, add as paragraph and end
        await addParagraph({
          id: crypto.randomUUID(),
          content: response.content
        });
        await endReality();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生错误');
    } finally {
      setLoading(false);
    }
  };

  if (!currentReality) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  const lastParagraph = currentReality.paragraphs[currentReality.paragraphs.length - 1];
  const showChoices = currentReality.status === 'active' && lastParagraph?.choices && !lastParagraph.chosenId;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-purple-900 to-gray-900">
      <PageHeader
        title={currentReality.status === 'ended' ? '回忆' : currentReality.title}
        showBack
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Pending state */}
        {currentReality.status === 'pending' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-6">✨</div>
            <h2 className="text-2xl font-bold text-white mb-4">{currentReality.title}</h2>
            <p className="text-gray-300 mb-8 leading-relaxed">
              {currentReality.paragraphs[0]?.content}
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="secondary" onClick={handleReject}>
                拒绝
              </Button>
              <Button onClick={handleAccept}>
                接受邀请
              </Button>
            </div>
          </div>
        )}

        {/* Active or ended state */}
        {(currentReality.status === 'active' || currentReality.status === 'ended') && (
          <div className="space-y-6">
            {currentReality.paragraphs.map((paragraph, index) => (
              <div key={paragraph.id} className="animate-fade-in">
                <p className="text-white leading-relaxed whitespace-pre-wrap">
                  {paragraph.content}
                </p>
                {paragraph.chosenId && paragraph.choices && (
                  <p className="text-primary mt-2 italic">
                    → {paragraph.choices.find(c => c.id === paragraph.chosenId)?.label}
                  </p>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            )}
          </div>
        )}

        {/* Ended state indicator */}
        {currentReality.status === 'ended' && (
          <div className="text-center mt-12 py-6 border-t border-gray-700">
            <p className="text-gray-400">— 故事结束 —</p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-500/20 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Choices */}
      {showChoices && lastParagraph?.choices && (
        <div className="p-4 bg-gray-800/50 border-t border-gray-700 safe-bottom">
          <div className="flex flex-wrap gap-3 justify-center">
            {lastParagraph.choices.map((choice) => (
              <Button
                key={choice.id}
                variant="secondary"
                onClick={() => handleChoice(choice.id, choice.label)}
                disabled={loading}
                className="!bg-white/10 !text-white hover:!bg-white/20"
              >
                {choice.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
