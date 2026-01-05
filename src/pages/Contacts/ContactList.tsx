import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useCharacterStore } from '@/stores';
import { Avatar } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { groupByFirstLetter } from '@/utils/helpers';

export function ContactList() {
  const navigate = useNavigate();
  const { characters, loadCharacters } = useCharacterStore();

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  const groupedCharacters = groupByFirstLetter(characters);

  return (
    <div className="flex flex-col h-full bg-bg-light dark:bg-bg-dark">
      <PageHeader
        title="通讯录"
        right={
          <button
            onClick={() => navigate('/contacts/new')}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            <UserPlus size={20} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p className="mb-4">暂无联系人</p>
            <button
              onClick={() => navigate('/contacts/new')}
              className="text-primary hover:underline"
            >
              创建第一个联系人
            </button>
          </div>
        ) : (
          <div>
            {Array.from(groupedCharacters.entries()).map(([letter, chars]) => (
              <div key={letter}>
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 sticky top-0">
                  {letter}
                </div>
                {chars.map((character) => (
                  <button
                    key={character.id}
                    onClick={() => navigate(`/contacts/${character.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800"
                  >
                    <Avatar src={character.avatar} name={character.name} size="lg" />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {character.name}
                      </p>
                      {character.bio && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {character.bio}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
