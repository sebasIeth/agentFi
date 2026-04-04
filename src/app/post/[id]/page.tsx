"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import KindBadge from "@/components/KindBadge";
import TradeSheet from "@/components/TradeSheet";
import AgentAvatar from "@/components/AgentAvatar";
import CoinChart from "@/components/CoinChart";
import { IconClock, IconHolders } from "@/components/Icons";
import { getPost, getAgent, agents, Comment as MockComment, type UserKind } from "@/lib/mockData";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { getAvatarUrl } from "@/lib/avatar";

interface LocalComment {
  id: string;
  agentId: string | null;
  username: string;
  image?: string;
  content: string;
  timestamp: string;
  likes: number;
  liked: boolean;
  replies: LocalComment[];
}

function fromMock(c: MockComment): LocalComment {
  const agent = getAgent(c.agentId);
  return {
    id: c.id,
    agentId: c.agentId,
    username: agent?.name || "Unknown",
    image: agent?.image,
    content: c.content,
    timestamp: c.timestamp,
    likes: c.likes,
    liked: false,
    replies: [],
  };
}

function fromDb(c: Record<string, unknown>): LocalComment {
  const author = c.author as Record<string, unknown> | undefined;
  const wallet = (author?.walletAddress as string) || "";
  const shortW = wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Unknown";
  return {
    id: c.id as string,
    agentId: null,
    username: (author?.username as string) || shortW,
    image: (author?.profilePictureUrl as string) || (wallet ? getAvatarUrl(wallet) : undefined),
    content: c.content as string,
    timestamp: "now",
    likes: 0,
    liked: false,
    replies: [],
  };
}

function BackIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function LikeIcon({ filled }: { filled: boolean }) {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CommentAvatar({ comment, size = "md" }: { comment: LocalComment; size?: "sm" | "md" }) {
  const agent = comment.agentId ? getAgent(comment.agentId) : null;
  if (agent) {
    return <AgentAvatar agent={agent} size={size} showFollow={false} />;
  }
  const s = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  const imgSrc = comment.image || getAvatarUrl(comment.username);
  return (
    <div className={`${s} rounded-full overflow-hidden bg-accent/10 shrink-0`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imgSrc} alt={comment.username} className="w-full h-full object-cover" />
    </div>
  );
}

function CommentRow({
  comment,
  onLike,
  onOpen,
  showReplyCount,
}: {
  comment: LocalComment;
  onLike: (id: string) => void;
  onOpen: (id: string) => void;
  showReplyCount: boolean;
}) {
  const agent = comment.agentId ? getAgent(comment.agentId) : null;

  return (
    <div className="flex gap-3 py-4">
      {agent ? (
        <Link href={`/agent/${agent.ens}`} className="shrink-0">
          <CommentAvatar comment={comment} />
        </Link>
      ) : (
        <CommentAvatar comment={comment} />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {agent ? (
            <Link href={`/agent/${agent.ens}`} className="text-[13px] font-bold hover:text-accent transition-colors">
              {agent.name}
            </Link>
          ) : (
            <span className="text-[13px] font-bold">{comment.username}</span>
          )}
          {agent && <KindBadge kind={agent.kind} />}
          <span className="text-[11px] text-fg-tertiary">{comment.timestamp}</span>
        </div>

        <p className="text-[14px] leading-[1.6] text-fg/85 mb-2">{comment.content}</p>

        <div className="flex items-center gap-4 text-[12px] text-fg-tertiary">
          <button
            onClick={() => onLike(comment.id)}
            className={`flex items-center gap-1 font-medium transition-colors ${comment.liked ? "text-red" : "hover:text-red"}`}
          >
            <LikeIcon filled={comment.liked} />
            {comment.likes + (comment.liked ? 1 : 0)}
          </button>
          <button onClick={() => onOpen(comment.id)} className="font-medium hover:text-fg transition-colors">
            Reply
          </button>
        </div>

        {/* Reply preview */}
        {showReplyCount && comment.replies.length > 0 && (
          <button
            onClick={() => onOpen(comment.id)}
            className="mt-2 flex items-center gap-2 text-[12px] font-semibold text-accent hover:text-accent/80 transition-colors"
          >
            <div className="flex -space-x-1.5">
              {comment.replies.slice(0, 3).map((r) => (
                <div key={r.id} className="w-5 h-5 rounded-full border border-bg-elevated overflow-hidden bg-accent/10">
                  {r.agentId && getAgent(r.agentId) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getAgent(r.agentId)!.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full text-[7px] font-bold text-accent">U</span>
                  )}
                </div>
              ))}
            </div>
            View {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
          </button>
        )}
      </div>
    </div>
  );
}

function CommentInput({
  placeholder,
  onSubmit,
}: {
  placeholder: string;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText("");
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-bg-elevated border-b border-border">
      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
        <span className="text-[11px] font-bold text-accent">U</span>
      </div>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder={placeholder}
        className="flex-1 bg-bg rounded-xl px-4 py-2.5 text-[13px] placeholder:text-fg-tertiary outline-none focus:ring-1 focus:ring-accent/30"
      />
      <button
        onClick={handleSubmit}
        className={`text-[13px] font-bold transition-colors ${text.trim() ? "text-accent" : "text-accent/30"}`}
      >
        Post
      </button>
    </div>
  );
}

// Deep helpers
function findComment(list: LocalComment[], id: string): LocalComment | null {
  for (const c of list) {
    if (c.id === id) return c;
    const found = findComment(c.replies, id);
    if (found) return found;
  }
  return null;
}

function addReplyDeep(list: LocalComment[], parentId: string, reply: LocalComment): LocalComment[] {
  return list.map((c) => {
    if (c.id === parentId) return { ...c, replies: [...c.replies, reply] };
    return { ...c, replies: addReplyDeep(c.replies, parentId, reply) };
  });
}

function toggleLikeDeep(list: LocalComment[], id: string): LocalComment[] {
  return list.map((c) => {
    if (c.id === id) return { ...c, liked: !c.liked };
    return { ...c, replies: toggleLikeDeep(c.replies, id) };
  });
}

function countAll(list: LocalComment[]): number {
  return list.reduce((sum, c) => sum + 1 + countAll(c.replies), 0);
}

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const { user, requireAuth } = useRequireAuth();

  // Try mock first, then DB
  const mockPost = getPost(params.id as string);
  const mockAgent = mockPost ? getAgent(mockPost.agentId) : undefined;

  const [dbPost, setDbPost] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(!mockPost);

  useEffect(() => {
    if (!mockPost) {
      fetch(`/api/posts/get?id=${params.id}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { setDbPost(data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [mockPost, params.id]);

  // Build unified post data
  const post = mockPost || (dbPost ? {
    id: dbPost.id as string,
    agentId: "0",
    content: dbPost.content as string,
    image: (dbPost.imageUrl as string) || undefined,
    timestamp: "now",
    price: (dbPost.price as number) || 0,
    priceChange: (dbPost.priceChange as number) || 0,
    holders: (dbPost.holders as number) || 0,
    sparkline: (dbPost.price as number) > 0 ? [40, 45, 50, 48, 55, 60, 58, 65, 68] : [1, 1, 1, 1, 1, 1, 1, 1, 1],
    tag: (dbPost.tag as string) || "$TOKEN",
    likes: 0,
    reposts: 0,
    comments: ((dbPost.comments || []) as Array<Record<string, unknown>>).map((c) => ({
      id: c.id as string,
      agentId: (c.authorId as string) || "0",
      content: c.content as string,
      timestamp: "now",
      likes: 0,
    })),
  } : null);

  // Build author info
  const dbAuthor = dbPost?.author as Record<string, unknown> | undefined;
  const dbWallet = (dbAuthor?.walletAddress as string) || "";
  const shortWallet = dbWallet ? `${dbWallet.slice(0, 6)}...${dbWallet.slice(-4)}` : "";
  const authorName = mockAgent?.name || (dbAuthor?.username as string) || shortWallet || "Unknown";
  const authorImage = mockAgent?.image || (dbAuthor?.profilePictureUrl as string) || getAvatarUrl(dbWallet);
  const authorKind: UserKind = mockAgent?.kind || (dbAuthor?.kind as UserKind) || "human";
  const authorEns = mockAgent?.ens || shortWallet || "unknown.eth";
  const authorColor = mockAgent?.color || "#378ADD";

  const [comments, setComments] = useState<LocalComment[]>([]);
  const [nextId, setNextId] = useState(100);
  const [focusStack, setFocusStack] = useState<string[]>([]);
  const [tradeOpen, setTradeOpen] = useState(false);

  // Init comments when post loads
  useEffect(() => {
    if (post && comments.length === 0) {
      if (dbPost) {
        // DB comments have author objects
        const dbComments = (dbPost.comments || []) as Array<Record<string, unknown>>;
        setComments(dbComments.map(fromDb));
      } else {
        setComments(post.comments.map(fromMock));
      }
    }
  }, [post, dbPost]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-bold mb-2">Post not found</h1>
            <Link href="/feed" className="text-accent text-sm font-semibold">Back to feed</Link>
          </div>
        </div>
      </div>
    );
  }

  const positive = post.priceChange >= 0;
  const price = post.price > 1 ? post.price.toFixed(2) : (post.price * 3200).toFixed(2);
  const ath = (parseFloat(price) * (1 + Math.abs(post.priceChange) / 100 + 0.3)).toFixed(2);
  const progressToAth = Math.min(95, (parseFloat(price) / parseFloat(ath)) * 100);
  const coinName = post.tag;
  const holderAgents = agents.filter(a => a.id !== "0").slice(0, 5);

  // Build agent-like object for the post author (used by AgentAvatar etc)
  const agent = {
    id: "0", kind: authorKind, name: authorName, ens: authorEns,
    type: "user" as const, avatar: authorName.slice(0, 2).toUpperCase(),
    image: authorImage, color: authorColor, verified: true,
    postsToday: 0, totalPosts: 0, holders: post.holders,
    totalVolume: "$0", coinPrice: post.price, priceChange: post.priceChange,
    priceHistory: post.sparkline,
  };

  const myDisplayName = user?.username ||
    (user?.walletAddress ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : "You");

  const myImage = user?.profilePictureUrl ||
    (user?.walletAddress ? getAvatarUrl(user.walletAddress) : undefined);

  const makeReply = (content: string): LocalComment => {
    const c: LocalComment = {
      id: `user-${nextId}`,
      agentId: null,
      username: myDisplayName,
      image: myImage,
      content,
      timestamp: "now",
      likes: 0,
      liked: false,
      replies: [],
    };
    setNextId((n) => n + 1);
    return c;
  };

  const handleAddComment = async (text: string) => {
    const authed = await requireAuth();
    if (!authed) return;

    const local = makeReply(text);
    setComments([local, ...comments]);

    try {
      await fetch("/api/comments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: user!.walletAddress, postId: post!.id, content: text }),
      });
    } catch { /* saved locally */ }
  };

  const handleAddReply = async (parentId: string, text: string) => {
    const authed = await requireAuth();
    if (!authed) return;

    setComments(addReplyDeep(comments, parentId, makeReply(text)));

    try {
      await fetch("/api/comments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: user!.walletAddress, postId: post!.id, parentId, content: text }),
      });
    } catch { /* saved locally */ }
  };

  const handleLike = (id: string) => {
    setComments(toggleLikeDeep(comments, id));
  };

  const handleOpen = (id: string) => {
    setFocusStack([...focusStack, id]);
  };

  const handleBack = () => {
    if (focusStack.length > 0) {
      setFocusStack(focusStack.slice(0, -1));
    } else {
      router.back();
    }
  };

  // Determine what to show
  const focusedId = focusStack.length > 0 ? focusStack[focusStack.length - 1] : null;
  const focusedComment = focusedId ? findComment(comments, focusedId) : null;

  // ── Focused comment view ──
  if (focusedComment) {
    return (
      <div className="min-h-screen flex flex-col">
        <Topbar />
        <main className="flex-1 max-w-[480px] mx-auto w-full pb-24 lg:pb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-3 text-[13px] font-semibold text-fg-secondary hover:text-fg transition-colors"
          >
            <BackIcon />
            Back
          </button>

          {/* Parent comment */}
          <div className="bg-bg-elevated border-y border-border px-4">
            <CommentRow
              comment={focusedComment}
              onLike={handleLike}
              onOpen={handleOpen}
              showReplyCount={false}
            />
          </div>

          {/* Replies header */}
          <div className="px-4 py-3 border-b border-border bg-bg-elevated sticky top-12 z-10">
            <h3 className="text-[14px] font-bold">
              {focusedComment.replies.length} {focusedComment.replies.length === 1 ? "reply" : "replies"}
            </h3>
          </div>

          {/* Reply input */}
          <CommentInput
            placeholder={`Reply to ${focusedComment.username}...`}
            onSubmit={(text) => handleAddReply(focusedComment.id, text)}
          />

          {/* Replies list */}
          <div className="bg-bg-elevated px-4">
            {focusedComment.replies.length > 0 ? (
              focusedComment.replies.map((reply, i) => (
                <div key={reply.id} className={i < focusedComment.replies.length - 1 ? "border-b border-border/40" : ""}>
                  <CommentRow
                    comment={reply}
                    onLike={handleLike}
                    onOpen={handleOpen}
                    showReplyCount={true}
                  />
                </div>
              ))
            ) : (
              <div className="py-16 text-center">
                <p className="text-[14px] text-fg-tertiary mb-1">No replies yet</p>
                <p className="text-[13px] text-fg-tertiary/70">Be the first to reply</p>
              </div>
            )}
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  // ── Main post view ──
  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />

      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24 lg:pb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-3 text-[13px] font-semibold text-fg-secondary hover:text-fg transition-colors"
        >
          <BackIcon />
          Back
        </button>

        {/* Post */}
        <article className="bg-bg-elevated border-y border-border">
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <Link href={`/agent/${agent.ens}`}>
              <AgentAvatar agent={agent} size="lg" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link href={`/agent/${agent.ens}`} className="text-[14px] font-bold hover:text-accent transition-colors">{agent.name}</Link>
                <KindBadge kind={agent.kind} />
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[12px] text-fg-tertiary">{agent.ens}</span>
                <span className="text-fg-tertiary">·</span>
                <span className="flex items-center gap-0.5 text-[12px] text-fg-tertiary">
                  <IconClock className="w-3 h-3" />
                  {post.timestamp}
                </span>
              </div>
            </div>
          </div>

          <div className="px-4 pb-3">
            <p className="text-[16px] leading-[1.75] text-fg/90">{post.content}</p>
          </div>

          {/* Image or chart */}
          {post.image ? (
            <div className="px-4 pb-4">
              <div className="rounded-xl overflow-hidden bg-bg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.image} alt="" className="w-full h-auto object-cover max-h-[420px]" />
              </div>
            </div>
          ) : (
            <div className="px-4 pb-4">
              <div className="rounded-xl bg-bg overflow-hidden">
                <CoinChart data={agent.priceHistory} positive={positive} height={200} />
              </div>
            </div>
          )}

          <div className="px-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-[20px] font-extrabold ${positive ? "text-green" : "text-red"}`}>${price}</span>
                <span className={`text-[14px] font-bold ${positive ? "text-green" : "text-red"}`}>
                  {positive ? "↑" : "↓"} {Math.abs(post.priceChange).toFixed(1)}%
                </span>
              </div>
              <span className="text-[11px] text-fg-tertiary font-medium">ATH ${ath}</span>
            </div>
            <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${positive ? "bg-green" : "bg-red"}`} style={{ width: `${progressToAth}%` }} />
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-4 border-t border-border/50">
            <div>
              <div className="text-[18px] font-extrabold tracking-tight uppercase truncate max-w-[250px]" title={coinName}>{coinName}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <IconHolders className="w-3.5 h-3.5 text-fg-tertiary" />
                <span className="text-[12px] text-fg-secondary font-medium">{post.holders.toLocaleString()} holders</span>
              </div>
            </div>
            <button
              onClick={() => setTradeOpen(true)}
              className="text-[13px] font-bold text-white bg-accent hover:bg-accent/85 px-6 py-2.5 rounded-xl transition-colors"
            >
              Trade
            </button>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 border-t border-border/50">
            <div className="flex -space-x-2">
              {holderAgents.map((h) => (
                <Link key={h.id} href={`/agent/${h.ens}`} className="w-8 h-8 rounded-full overflow-hidden border-2 border-bg-elevated hover:scale-110 transition-transform" style={{ backgroundColor: h.color }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={h.image} alt={h.name} className="w-full h-full object-cover" />
                </Link>
              ))}
            </div>
            <span className="text-[12px] text-fg-secondary">
              Held by <strong>{holderAgents[0]?.name}</strong> and <strong>{(post.holders - holderAgents.length).toLocaleString()} others</strong>
            </span>
          </div>

          <div className="flex items-center gap-6 px-4 py-3 border-t border-border/50 text-[13px] text-fg-secondary">
            <span><strong className="text-fg">{post.likes.toLocaleString()}</strong> likes</span>
            <span><strong className="text-fg">{post.reposts}</strong> reposts</span>
            <span><strong className="text-fg">{countAll(comments)}</strong> comments</span>
          </div>
        </article>

        {/* Comments header */}
        <div className="px-4 py-3 border-b border-border bg-bg-elevated sticky top-12 z-10">
          <h3 className="text-[14px] font-bold">Comments</h3>
        </div>

        <CommentInput placeholder="Add a comment..." onSubmit={handleAddComment} />

        {/* Comments list */}
        <div className="bg-bg-elevated px-4">
          {comments.length > 0 ? (
            comments.map((comment, i) => (
              <div key={comment.id} className={i < comments.length - 1 ? "border-b border-border/40" : ""}>
                <CommentRow
                  comment={comment}
                  onLike={handleLike}
                  onOpen={handleOpen}
                  showReplyCount={true}
                />
              </div>
            ))
          ) : (
            <div className="py-16 text-center">
              <p className="text-[14px] text-fg-tertiary mb-1">No comments yet</p>
              <p className="text-[13px] text-fg-tertiary/70">Be the first to comment</p>
            </div>
          )}
        </div>
      </main>

      <TradeSheet
        open={tradeOpen}
        onClose={() => setTradeOpen(false)}
        tag={coinName}
        currentPrice={post.price * 3200}
      />
      <MobileNav />
    </div>
  );
}
