import UserDashboardLayout from '@/components/UserDashboardLayout';
import { useState } from "react";
import { useParams, NavLink } from "react-router-dom";
import { useDiscussion, useComments, useCreateComment, useVote } from "@/hooks/useDiscussions";
import type { IDiscussionComment } from "@/types/discussion/discussion";

const DiscussionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [commentContent, setCommentContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const { data: discussion, isLoading, error } = useDiscussion(id || "");
  const { data: comments } = useComments(id || "");
  const createCommentMutation = useCreateComment();
  const voteMutation = useVote();

  const handleVote = (targetId: string, targetType: 'discussion' | 'comment', voteType: 'upvote' | 'downvote') => {
    voteMutation.mutate({ target_id: targetId, target_type: targetType, vote_type: voteType });
  };

  const handleSubmitComment = () => {
    if (!id || !commentContent.trim()) return;
    
    createCommentMutation.mutate({
      discussion_id: id,
      parent_id: replyTo || undefined,
      content: commentContent,
    }, {
      onSuccess: () => {
        setCommentContent("");
        setReplyTo(null);
      },
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) return `${diffInMinutes} MIN${diffInMinutes !== 1 ? 'S' : ''} AGO`;
    if (diffInHours < 24) return `${diffInHours} HR${diffInHours !== 1 ? 'S' : ''} AGO`;
    if (diffInDays === 1) return '1 DAY AGO';
    return `${diffInDays} DAYS AGO`;
  };

  const renderComment = (comment: IDiscussionComment, depth = 0) => {
    const avatar = comment.username?.charAt(0).toUpperCase() || 'U';
    const netVotes = comment.upvotes - comment.downvotes;

    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-8 mt-3' : 'mt-4'}`}>
        <div className="border-2 border-dashed border-[#333] p-4">
          <div className="flex gap-4">
            {/* Avatar */}
            <div className="w-8 h-8 border-2 border-[#4ECDC4] flex items-center justify-center text-[#4ECDC4] font-bold text-xs shrink-0">
              {avatar}
            </div>

            <div className="flex-1 min-w-0">
              {/* Comment Header */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-gray-400 text-xs font-mono">{comment.username?.toUpperCase()}</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-500 text-[10px]">{formatTimeAgo(comment.created_at)}</span>
                {comment.is_solution && (
                  <span className="bg-[#4ECDC4] text-black text-[8px] font-bold px-2 py-0.5 tracking-widest">
                    ✓ SOLUTION
                  </span>
                )}
              </div>

              {/* Comment Content */}
              <p className="text-gray-300 text-sm mb-3 whitespace-pre-wrap">{comment.content}</p>

              {/* Comment Actions */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVote(comment.id, 'comment', 'upvote')}
                    className="text-gray-500 hover:text-[#4ECDC4] transition-colors"
                  >
                    ▲
                  </button>
                  <span className={`text-xs font-mono ${netVotes > 0 ? 'text-[#4ECDC4]' : netVotes < 0 ? 'text-[#E54B4B]' : 'text-gray-500'}`}>
                    {netVotes}
                  </span>
                  <button
                    onClick={() => handleVote(comment.id, 'comment', 'downvote')}
                    className="text-gray-500 hover:text-[#E54B4B] transition-colors"
                  >
                    ▼
                  </button>
                </div>
                <button
                  onClick={() => setReplyTo(comment.id)}
                  className="text-[10px] text-gray-500 hover:text-[#4ECDC4] tracking-widest"
                >
                  REPLY
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Render Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div>
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <UserDashboardLayout>
        <div className="max-w-4xl">
          <div className="text-center py-12">
            <p className="text-gray-500 text-xs font-mono tracking-widest">LOADING DISCUSSION...</p>
          </div>
        </div>
      </UserDashboardLayout>
    );
  }

  if (error || !discussion) {
    return (
      <UserDashboardLayout>
        <div className="max-w-4xl">
          <div className="border-2 border-[#E54B4B] p-6 text-center">
            <p className="text-[#E54B4B] text-xs font-mono tracking-widest mb-2">ERROR LOADING DISCUSSION</p>
            <p className="text-gray-500 text-xs">{error?.message || 'Discussion not found'}</p>
            <NavLink to="/discussions" className="mt-4 inline-block text-[#4ECDC4] text-xs tracking-widest hover:underline">
              ← BACK TO DISCUSSIONS
            </NavLink>
          </div>
        </div>
      </UserDashboardLayout>
    );
  }

  const parsedTags: string[] = Array.isArray(discussion.tags) ? discussion.tags : [];
  const avatar = discussion.username?.charAt(0).toUpperCase() || 'U';
  const netVotes = discussion.upvotes - discussion.downvotes;

  return (
    <UserDashboardLayout>
      <div className="max-w-4xl">
        {/* Back Button */}
        <NavLink 
          to="/discussions" 
          className="inline-flex items-center gap-2 text-gray-500 text-xs tracking-widest hover:text-[#4ECDC4] transition-colors mb-6"
        >
          ← BACK TO DISCUSSIONS
        </NavLink>

        {/* Discussion Content */}
        <div className="border-2 border-[#4ECDC4] p-6 mb-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 border-2 border-[#4ECDC4] flex items-center justify-center text-[#4ECDC4] font-bold shrink-0">
              {avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-gray-400 text-xs font-mono">{discussion.username?.toUpperCase()}</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-500 text-xs">{formatTimeAgo(discussion.created_at)}</span>
                {discussion.is_solved && (
                  <span className="bg-[#4ECDC4] text-black text-[8px] font-bold px-2 py-0.5 tracking-widest">
                    ✓ SOLVED
                  </span>
                )}
              </div>
              <h1 className="text-2xl text-white font-bold tracking-tight mb-3">
                {discussion.title.toUpperCase()}
              </h1>
              {parsedTags.length > 0 && (
                <div className="flex gap-2">
                  {parsedTags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-[8px] tracking-widest px-2 py-0.5 border border-[#F7D046] text-[#F7D046]"
                    >
                      #{tag.toUpperCase()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="text-gray-300 mb-4 whitespace-pre-wrap leading-relaxed">
            {discussion.content}
          </div>

          {/* Stats & Actions */}
          <div className="flex items-center gap-6 pt-4 border-t-2 border-dashed border-[#333]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleVote(discussion.id, 'discussion', 'upvote')}
                className="text-gray-500 hover:text-[#4ECDC4] transition-colors"
              >
                ▲
              </button>
              <span className={`text-sm font-mono ${netVotes > 0 ? 'text-[#4ECDC4]' : netVotes < 0 ? 'text-[#E54B4B]' : 'text-gray-500'}`}>
                {netVotes}
              </span>
              <button
                onClick={() => handleVote(discussion.id, 'discussion', 'downvote')}
                className="text-gray-500 hover:text-[#E54B4B] transition-colors"
              >
                ▼
              </button>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <span>💬</span>
              <span>{discussion.comment_count} comments</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <span>👁</span>
              <span>{discussion.view_count} views</span>
            </div>
          </div>
        </div>

        {/* Add Comment */}
        <div className="border-2 border-dashed border-[#333] p-4 mb-6">
          <p className="text-[10px] text-gray-600 tracking-widest mb-3">
            {replyTo ? 'REPLY TO COMMENT' : 'ADD A COMMENT'}
          </p>
          <textarea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full bg-transparent border-2 border-[#333] px-4 py-3 text-white text-sm font-mono placeholder:text-gray-600 focus:border-[#4ECDC4] focus:outline-none transition-colors mb-3 resize-none"
            rows={4}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmitComment}
              disabled={!commentContent.trim() || createCommentMutation.isPending}
              className="px-4 py-2 bg-[#4ECDC4] text-black text-xs font-bold tracking-widest hover:bg-[#3db3aa] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createCommentMutation.isPending ? 'POSTING...' : 'POST COMMENT'}
            </button>
            {replyTo && (
              <button
                onClick={() => setReplyTo(null)}
                className="px-4 py-2 border-2 border-[#333] text-gray-500 text-xs font-bold tracking-widest hover:border-[#E54B4B] hover:text-[#E54B4B] transition-colors"
              >
                CANCEL REPLY
              </button>
            )}
          </div>
        </div>

        {/* Comments */}
        <div>
          <p className="text-[10px] text-gray-600 tracking-widest mb-4">
            {discussion.comment_count} COMMENT{discussion.comment_count !== 1 ? 'S' : ''}
          </p>
          {comments && comments.length > 0 ? (
            <div className="space-y-0">
              {comments.map((comment) => renderComment(comment))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-[#333] p-6 text-center">
              <p className="text-gray-500 text-xs">No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      </div>
    </UserDashboardLayout>
  );
};

export default DiscussionDetail;
