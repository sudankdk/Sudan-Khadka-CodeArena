import UserDashboardLayout from '@/components/UserDashboardLayout';
import { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useDiscussions, useDiscussionStats, useCreateDiscussion } from "@/hooks/useDiscussions";
import type { IDiscussionFilters } from "@/types/discussion/discussion";

const Discussion = () => {
  const [activeTab, setActiveTab] = useState("TRENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // New post dialog state
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTags, setNewPostTags] = useState("");

  const tabs = ["TRENDING", "LATEST", "TOP", "MY POSTS", "SAVED"];

  const tags = [
    { name: "ARRAY", color: "#F7D046" },
    { name: "DP", color: "#E54B4B" },
    { name: "INTERVIEW", color: "#4ECDC4" },
    { name: "TIPS", color: "#F7D046" },
    { name: "CAREER", color: "#4ECDC4" },
    { name: "HELP", color: "#E54B4B" },
  ];

  // Build filters based on active tab and search
  const filters = useMemo<IDiscussionFilters>(() => {
    const baseFilters: IDiscussionFilters = {};

    // Apply search
    if (searchQuery.trim()) {
      baseFilters.search = searchQuery.trim();
    }

    // Apply tag filter
    if (selectedTag) {
      baseFilters.tag = selectedTag;
    }

    // Apply sorting based on tab
    switch (activeTab) {
      case "TRENDING":
        baseFilters.sort_by = "popular";
        break;
      case "LATEST":
        baseFilters.sort_by = "newest";
        break;
      case "TOP":
        baseFilters.sort_by = "most_voted";
        break;
      case "MY POSTS":
        // TODO: Add user_id filter when auth is implemented
        break;
      case "SAVED":
        // TODO: Implement saved discussions
        break;
    }

    return baseFilters;
  }, [activeTab, searchQuery, selectedTag]);

  // Fetch discussions
  const { data: discussionsData, isLoading, error } = useDiscussions(page, pageSize, filters);
  const { data: stats } = useDiscussionStats();
  const createDiscussionMutation = useCreateDiscussion();

  const discussions = discussionsData?.data || [];
  const totalPages = discussionsData?.meta.total_pages || 1;

  const handleCreateDiscussion = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    createDiscussionMutation.mutate({
      title: newPostTitle,
      content: newPostContent,
      tags: newPostTags || undefined,
    }, {
      onSuccess: () => {
        setShowNewPostDialog(false);
        setNewPostTitle("");
        setNewPostContent("");
        setNewPostTags("");
        setPage(1); // Go to first page to see new post
      },
    });
  };

  const getTagColor = (tag: string) => {
    const found = tags.find((t) => t.name === tag);
    return found?.color || "#F7D046";
  };

  const handleTagClick = (tagName: string) => {
    setSelectedTag(selectedTag === tagName ? undefined : tagName);
    setPage(1); // Reset to first page
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

  return (
    <UserDashboardLayout>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-gray-600 text-xs font-mono tracking-widest mb-1">THE FORUM</p>
            <h1 className="text-3xl text-white font-bold tracking-tight">
              DISCUSSION<span className="text-[#4ECDC4] ml-2">💬</span>
            </h1>
            <p className="text-gray-500 text-xs font-mono mt-2">"ART IS HOW WE DECORATE SPACE, MUSIC IS HOW WE DECORATE TIME" — JMB</p>
          </div>
          <button 
            onClick={() => setShowNewPostDialog(true)}
            className="px-5 py-3 bg-[#F7D046] text-black text-xs font-bold tracking-widest hover:bg-[#f5c518] transition-colors"
          >
            + NEW POST
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="SEARCH DISCUSSIONS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-2 border-[#333] px-4 py-3 text-white text-xs font-mono tracking-wider placeholder:text-gray-600 focus:border-[#4ECDC4] focus:outline-none transition-colors"
          />
        </div>

        {/* Tags */}
        <div className="flex gap-2 mb-6">
          {tags.map((tag) => (
            <button
              key={tag.name}
              onClick={() => handleTagClick(tag.name)}
              className={`px-3 py-1 text-[10px] tracking-widest font-mono border transition-colors ${
                selectedTag === tag.name ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
              style={{ borderColor: tag.color, color: tag.color }}
            >
              #{tag.name}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b-2 border-dashed border-[#333] pb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-[10px] font-mono tracking-widest transition-all ${
                activeTab === tab
                  ? "bg-[#4ECDC4] text-black"
                  : "text-gray-500 hover:text-white border border-[#333] hover:border-[#4ECDC4]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-3">
            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-xs font-mono tracking-widest">LOADING DISCUSSIONS...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="border-2 border-[#E54B4B] p-6 text-center">
                <p className="text-[#E54B4B] text-xs font-mono tracking-widest mb-2">ERROR LOADING DISCUSSIONS</p>
                <p className="text-gray-500 text-xs">{error.message}</p>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && discussions.length === 0 && (
              <div className="border-2 border-dashed border-[#333] p-12 text-center">
                <p className="text-gray-500 text-xs font-mono tracking-widest mb-2">NO DISCUSSIONS FOUND</p>
                <p className="text-gray-600 text-[10px]">Be the first to start a discussion!</p>
              </div>
            )}

            {/* Discussions List */}
            {!isLoading && !error && discussions.map((post) => {
              const parsedTags: string[] = Array.isArray(post.tags) ? post.tags : [];
              const avatar = post.username?.charAt(0).toUpperCase() || 'U';
              const netVotes = post.upvotes - post.downvotes;

              return (
                <NavLink
                  key={post.id}
                  to={`/discussion/${post.id}`}
                  className="block border-2 border-dashed border-[#333] p-4 hover:border-[#4ECDC4] transition-colors group relative"
                >
                  {post.is_solved && (
                    <span className="absolute -top-2 left-4 bg-[#4ECDC4] text-black text-[8px] font-bold px-2 py-0.5 tracking-widest">
                      ✓ SOLVED
                    </span>
                  )}
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 border-2 border-[#4ECDC4] flex items-center justify-center text-[#4ECDC4] font-bold shrink-0">
                      {avatar}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold tracking-wide text-sm mb-2 group-hover:text-[#4ECDC4] transition-colors">
                        {post.title.toUpperCase()}
                      </h3>
                      <div className="flex items-center gap-4 text-[10px] text-gray-500">
                        <span className="text-gray-400">{post.username?.toUpperCase()}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(post.created_at)}</span>
                        <span>•</span>
                        <span>{post.view_count.toLocaleString()} views</span>
                      </div>
                      {parsedTags.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {parsedTags.map((tag: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-[8px] tracking-widest px-2 py-0.5"
                              style={{ color: getTagColor(tag.toUpperCase()), borderColor: getTagColor(tag.toUpperCase()), borderWidth: 1 }}
                            >
                              #{tag.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 items-center text-xs font-mono">
                      <div className="text-center">
                        <p className={netVotes > 0 ? "text-[#4ECDC4]" : netVotes < 0 ? "text-[#E54B4B]" : "text-gray-500"}>
                          {netVotes > 0 ? '▲' : netVotes < 0 ? '▼' : '♥'}
                        </p>
                        <p className="text-gray-500">{Math.abs(netVotes)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#4ECDC4]">💬</p>
                        <p className="text-gray-500">{post.comment_count}</p>
                      </div>
                    </div>
                  </div>
                </NavLink>
              );
            })}

            {/* Pagination */}
            {!isLoading && !error && discussions.length > 0 && (
              <div className="flex gap-2 justify-center items-center">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border-2 border-dashed border-[#333] text-gray-500 text-xs tracking-widest hover:border-[#4ECDC4] hover:text-[#4ECDC4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← PREV
                </button>
                <span className="text-gray-500 text-xs font-mono">
                  PAGE {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 border-2 border-dashed border-[#333] text-gray-500 text-xs tracking-widest hover:border-[#4ECDC4] hover:text-[#4ECDC4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  NEXT →
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-64 space-y-6">
            {/* Discussion Stats */}
            <div className="border-2 border-[#4ECDC4] p-4 relative">
              <span className="absolute -top-2 -right-2 text-[#4ECDC4] text-xs">📊</span>
              <p className="text-[10px] text-gray-600 tracking-widest mb-4">FORUM STATS</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-[10px]">TOTAL DISCUSSIONS</span>
                  <span className="text-white text-sm font-bold font-mono">{stats?.total_discussions || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-[10px]">SOLVED</span>
                  <span className="text-[#4ECDC4] text-sm font-bold font-mono">{stats?.solved_count || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-[10px]">TOTAL COMMENTS</span>
                  <span className="text-white text-sm font-bold font-mono">{stats?.total_comments || 0}</span>
                </div>
              </div>
            </div>

            {/* Guidelines */}
            <div className="border-2 border-dashed border-[#333] p-4">
              <p className="text-[10px] text-gray-600 tracking-widest mb-3">RULES ©</p>
              <ul className="space-y-2 text-[10px] text-gray-500">
                <li>• BE RESPECTFUL</li>
                <li>• NO SPAM OR SELF-PROMO</li>
                <li>• USE PROPER TAGS</li>
                <li>• SEARCH BEFORE POSTING</li>
                <li>• SHARE KNOWLEDGE FREELY</li>
              </ul>
            </div>

            {/* Basquiat */}
            <div className="text-[#222] text-[8px] font-mono">
              <p>"I START A PICTURE AND I FINISH IT.</p>
              <p>I DON'T THINK ABOUT ART WHILE I WORK."</p>
              <p className="text-[#4ECDC4] mt-1">— SAMO© 1983</p>
            </div>
          </div>
        </div>
      </div>

      {/* New Post Dialog */}
      {showNewPostDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border-2 border-[#F7D046] max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl text-white font-bold tracking-tight">
                CREATE NEW DISCUSSION
              </h2>
              <button
                onClick={() => setShowNewPostDialog(false)}
                className="text-gray-500 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-[10px] text-gray-600 tracking-widest mb-2">
                  TITLE
                </label>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="Enter discussion title..."
                  className="w-full bg-transparent border-2 border-[#333] px-4 py-3 text-white text-sm font-mono placeholder:text-gray-600 focus:border-[#4ECDC4] focus:outline-none transition-colors"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[10px] text-gray-600 tracking-widest mb-2">
                  TAGS (COMMA SEPARATED)
                </label>
                <input
                  type="text"
                  value={newPostTags}
                  onChange={(e) => setNewPostTags(e.target.value)}
                  placeholder="e.g., ARRAY, DP, INTERVIEW"
                  className="w-full bg-transparent border-2 border-[#333] px-4 py-3 text-white text-sm font-mono placeholder:text-gray-600 focus:border-[#4ECDC4] focus:outline-none transition-colors"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-[10px] text-gray-600 tracking-widest mb-2">
                  CONTENT
                </label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share your thoughts, ask a question, or start a discussion..."
                  className="w-full bg-transparent border-2 border-[#333] px-4 py-3 text-white text-sm font-mono placeholder:text-gray-600 focus:border-[#4ECDC4] focus:outline-none transition-colors resize-none"
                  rows={8}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowNewPostDialog(false)}
                  className="px-4 py-2 border-2 border-[#333] text-gray-500 text-xs font-bold tracking-widest hover:border-[#E54B4B] hover:text-[#E54B4B] transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleCreateDiscussion}
                  disabled={!newPostTitle.trim() || !newPostContent.trim() || createDiscussionMutation.isPending}
                  className="px-4 py-2 bg-[#F7D046] text-black text-xs font-bold tracking-widest hover:bg-[#f5c518] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createDiscussionMutation.isPending ? 'CREATING...' : 'CREATE POST'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </UserDashboardLayout>
  );
};

export default Discussion;
