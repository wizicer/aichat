import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useRealityStore, useChatStore, useCharacterStore, useSettingsStore, useLoreBookStore } from '@/stores';
import { Button } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { aiService } from '@/services/ai';
import type { AIDebugInfo } from '@/types';

export function RealityDetail() {
  const { id, rid } = useParams<{ id: string; rid: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debug info (in-memory only)
  const [lastDebugInfo, setLastDebugInfo] = useState<AIDebugInfo | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const { currentReality, loadReality, selectChoice, addParagraph, acceptReality, rejectReality, endReality } = useRealityStore();
  const { currentChat, loadChat, addMessage } = useChatStore();
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

    // Handle 'end' choice - generate summary, end reality and go back to chat
    if (choiceId === 'end') {
      setLoading(true);
      setError(null);
      
      try {
        await selectChoice(lastParagraph.id, choiceId);
        
        // Get character for summary generation
        const character = await getCharacter(currentChat.characterId);
        if (character && settings) {
          // Build paragraph history including the end choice
          const paragraphHistory = currentReality.paragraphs.map(p => ({
            content: p.content,
            chosenLabel: p.choices?.find(c => c.id === p.chosenId)?.label
          }));
          paragraphHistory[paragraphHistory.length - 1].chosenLabel = choiceLabel;
          
          // Generate summary
          const summary = await aiService.summarizeReality(
            settings,
            character,
            currentReality.title,
            paragraphHistory
          );
          
          // End reality with summary
          await endReality(summary);
          
          // Add summary as system message in chat
          await addMessage({
            chatId: currentChat.id,
            sender: 'system',
            type: 'text',
            content: `[${currentReality.title}] ${summary}`,
            recalled: false
          });
        } else {
          await endReality();
        }
        
        navigate(`/chat/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : '结束失败');
      } finally {
        setLoading(false);
      }
      return;
    }

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

      // Continue reality with debug info if enabled
      const includeDebug = settings.debugMode || false;
      const { response, debug } = await aiService.continueReality(
        settings,
        character,
        currentReality.title,
        paragraphHistory,
        loreBooks,
        includeDebug
      );
      
      if (debug) {
        setLastDebugInfo(debug);
      }

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
            {currentReality.paragraphs.map((paragraph) => (
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

      {/* Debug info display */}
      {settings?.debugMode && lastDebugInfo && (
        <div className="px-4 py-2 border-t border-gray-700 bg-gray-800/50">
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300"
          >
            <span>Token: {lastDebugInfo.totalTokens} ({lastDebugInfo.promptTokens}+{lastDebugInfo.completionTokens})</span>
            {showDebugInfo ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showDebugInfo && (
            <div className="mt-2 p-2 bg-gray-900/50 rounded text-xs overflow-auto max-h-40">
              <div className="mb-2">
                <strong className="text-gray-300">Prompt:</strong>
                <pre className="whitespace-pre-wrap mt-1 text-gray-400">
                  {lastDebugInfo.prompt.map((m) => `[${m.role}]: ${m.content.slice(0, 150)}${m.content.length > 150 ? '...' : ''}`).join('\n\n')}
                </pre>
              </div>
              <div>
                <strong className="text-gray-300">Raw Response:</strong>
                <pre className="whitespace-pre-wrap mt-1 text-gray-400">
                  {lastDebugInfo.rawResponse}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Choices */}
      {showChoices && lastParagraph?.choices && (
        <div className="p-4 bg-gray-800/50 border-t border-gray-700 safe-bottom">
          <div className="flex flex-wrap gap-3 justify-center">
            {lastParagraph.choices.map((choice) => (
              <Button
                key={choice.id}
                variant={choice.id === 'end' ? 'secondary' : 'secondary'}
                onClick={() => handleChoice(choice.id, choice.label)}
                disabled={loading}
                className={choice.id === 'end' 
                  ? '!bg-red-500/20 !text-red-300 hover:!bg-red-500/30 !border-red-500/50' 
                  : '!bg-white/10 !text-white hover:!bg-white/20'
                }
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
