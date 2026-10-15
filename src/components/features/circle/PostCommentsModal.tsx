/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Post, Comment, UserProfile, Song, SongVersion } from '../../../types/models';
import { Avatar } from '../../common/Avatar';

interface PostCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  creator: UserProfile;
  currentUser: UserProfile;
  comments: Comment[];
  allArtists: Record<string, UserProfile>;
  song?: Song;
  postVersion?: SongVersion;
  onAddComment: (postId: string, text: string) => { success: boolean; error?: string };
}

export const PostCommentsModal: React.FC<PostCommentsModalProps> = ({
  isOpen,
  onClose,
  post,
  creator,
  currentUser,
  comments,
  allArtists,
  song,
  postVersion,
  onAddComment,
}) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const postComments = comments.filter((c) => c.postId === post.id);

  // Focus input and scroll to bottom on open
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setTimeout(() => {
        inputRef.current?.focus();
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) {
      setErrorMessage('Comment cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = onAddComment(post.id, trimmed);
      if (res.success) {
        setCommentText('');
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        setErrorMessage(res.error || 'Failed to submit comment. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error posting comment.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickEmoji = (emoji: string) => {
    setCommentText((prev) => `${prev}${emoji}`);
    setErrorMessage(null);
    inputRef.current?.focus();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1C1C1E] text-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[85vh] h-[600px] border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-250">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-extrabold tracking-tight">Comments</h3>
            <span className="text-xs font-bold text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
              {postComments.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer text-sm"
            aria-label="Close comments"
          >
            ✕
          </button>
        </div>

        {/* Post Context Banner */}
        <div className="px-5 py-3 bg-white/5 border-b border-white/10 flex items-center gap-3 shrink-0">
          <Avatar
            src={creator.avatarUrl}
            alt={creator.displayName}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate">{creator.displayName}</span>
              <span className="text-[11px] text-white/50">@{creator.username}</span>
              {post.postType === 'collab' && (
                <span className="text-[9px] bg-[#D9F56A] text-[#20201E] font-black px-1.5 py-0.2 rounded-xs">
                  🧬 Collab
                </span>
              )}
            </div>
            <p className="text-xs text-white/70 truncate mt-0.5">{post.caption}</p>
          </div>
        </div>

        {/* Comments Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {postComments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/60">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl mb-2">
                💬
              </div>
              <p className="text-sm font-bold text-white">No comments yet</p>
              <p className="text-xs text-white/50 max-w-xs mt-1">
                Be the first to share your thoughts, drop feedback, or propose a collab on this track!
              </p>
            </div>
          ) : (
            postComments.map((comment) => {
              const author = allArtists[comment.authorId] ||
                (comment.authorId === currentUser.id ? currentUser : {
                  displayName: 'Musician',
                  username: 'artist',
                  avatarUrl: '',
                });
              const isCreator = comment.authorId === creator.id;

              return (
                <div key={comment.id} className="flex items-start gap-3 group">
                  <Avatar
                    src={author.avatarUrl}
                    alt={author.displayName}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white hover:underline cursor-pointer">
                        {author.displayName}
                      </span>
                      {isCreator && (
                        <span className="text-[9px] bg-[#FF5A36] text-white font-extrabold px-1.5 py-0.2 rounded-xs">
                          Creator
                        </span>
                      )}
                      <span className="text-[10px] text-white/40">{comment.createdAt}</span>
                    </div>
                    <p className="text-xs text-white/90 leading-relaxed mt-1 break-words">
                      {comment.text}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Quick Emoji Bar */}
        <div className="px-5 py-2 bg-white/[0.02] border-t border-white/5 flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
          {['🔥', '🧬', '🎸', '👏', '🥁', '✨', '❤️'].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleQuickEmoji(emoji)}
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs transition-colors cursor-pointer active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="px-5 py-1.5 bg-red-500/20 border-t border-red-500/30 text-red-300 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-300 hover:text-white cursor-pointer ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input & Submit Area */}
        <form onSubmit={handleSubmit} className="p-3 bg-[#141416] border-t border-white/10 shrink-0 flex items-center gap-2.5">
          <Avatar
            src={currentUser.avatarUrl}
            alt={currentUser.displayName}
            size="sm"
          />
          <div className="flex-1 relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={commentText}
              onChange={(e) => {
                setCommentText(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder={`Comment as ${currentUser.username}...`}
              maxLength={300}
              disabled={isSubmitting}
              className="w-full bg-white/10 text-white placeholder-white/40 text-xs rounded-full py-2.5 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-[#FF5A36] border border-transparent transition-all"
            />
            {commentText.length > 0 && (
              <span className="absolute right-3 text-[10px] text-white/40 font-mono pointer-events-none">
                {300 - commentText.length}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={!commentText.trim() || isSubmitting}
            className={`px-4 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer shadow-xs shrink-0 ${
              commentText.trim() && !isSubmitting
                ? 'bg-[#FF5A36] text-white hover:bg-[#F04D29] active:scale-95'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? '...' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
};
