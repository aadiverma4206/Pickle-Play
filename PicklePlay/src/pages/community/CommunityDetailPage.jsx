import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import {
  ArrowLeft, MapPin, Users as UsersIcon, Heart, MessageCircle, Pin, Trash2,
  Calendar, Clock, Trophy, Award, Check, X as XIcon, ShieldBan, PlusCircle,
  Image as ImageIcon, Video,
} from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { joinCommunity, createPost, registerForEvent, approveMembership, banMember } from '../../services/communityService';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Tabs from '../../components/ui/Tabs';
import ProgressBar from '../../components/ui/ProgressBar';
import { Input, Select, Textarea } from '../../components/ui/Field';
import { EmptyState, LoadingState } from '../../components/ui/States';
import { formatDate, formatTime, timeAgo, money } from '../../lib/format';
import CreateEventModal from './CreateEventModal';

const POST_TYPES = ['Text', 'Photo', 'Video', 'Poll', 'Achievement'];
const ROLE_LABEL = { OWNER: 'Owner', ADMIN: 'Admin', MODERATOR: 'Moderator', MEMBER: 'Member' };

export default function CommunityDetailPage() {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const user = useCurrentUser();
  // Whole-store subscription — every getter below builds a fresh array/object
  // per call, so it must be invoked in the render body off this stable
  // reference rather than inside a useStore(selector).
  const store = useStore();

  const [tab, setTab] = useState('feed');
  const [postType, setPostType] = useState('Text');
  const [postContent, setPostContent] = useState('');
  const [mediaPreview, setMediaPreview] = useState(null); // { url, kind: 'Photo'|'Video', fileName }
  const [mediaError, setMediaError] = useState('');
  const [commentDrafts, setCommentDrafts] = useState({});
  const [eventModalOpen, setEventModalOpen] = useState(false);

  const community = store.getCommunity(communityId);

  if (!community) return <LoadingState label="Loading community…" />;

  const membership = user ? store.membershipOf(communityId, user.id) : null;
  const isActiveMember = membership?.status === 'ACTIVE';
  // Community-level roles (Spec 22-25): OWNER/ADMIN manage membership & events,
  // OWNER/ADMIN/MODERATOR can moderate posts.
  const canManageCommunity = ['OWNER', 'ADMIN'].includes(membership?.role);
  const canModeratePosts = ['OWNER', 'ADMIN', 'MODERATOR'].includes(membership?.role);

  const members = store.membersOf(communityId);
  const pendingRequests = store.pendingRequestsFor(communityId);
  const posts = store.postsFor(communityId);
  const events = store.eventsFor(communityId);
  const challenges = store.challengesFor(communityId);

  const joinLabel = community.isPrivate ? 'Request to Join' : 'Join Community';

  const handleJoin = () => {
    if (!user) return;
    const result = joinCommunity(community.id, user.id);
    if (!result.ok) return store.toast(result.error, 'error');
    store.toast(result.status === 'PENDING' ? 'Request sent — the community owner will review it.' : `You joined "${community.name}"!`, result.status === 'PENDING' ? 'info' : 'success');
  };

  const MAX_MEDIA_BYTES = 20 * 1024 * 1024; // generous for a prototype — media lives only in browser memory (see note below)

  const handlePostTypeChange = (type) => {
    setPostType(type);
    setMediaPreview(null);
    setMediaError('');
  };

  const handleMediaChange = (e) => {
    const file = e.target.files?.[0];
    setMediaError('');
    if (!file) { setMediaPreview(null); return; }
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (postType === 'Photo' && !isImage) { setMediaError('Please choose an image file.'); return; }
    if (postType === 'Video' && !isVideo) { setMediaError('Please choose a video file.'); return; }
    if (file.size > MAX_MEDIA_BYTES) { setMediaError('File is too large for this prototype (max 20MB).'); return; }
    setMediaPreview({ url: URL.createObjectURL(file), kind: postType, fileName: file.name });
  };

  const handlePost = (e) => {
    e.preventDefault();
    const needsMedia = ['Photo', 'Video'].includes(postType);
    if (!postContent.trim() && !(needsMedia && mediaPreview)) {
      return store.toast(needsMedia ? 'Add a caption or attach a file to post.' : 'Write something to post.', 'error');
    }
    const result = createPost(community.id, user.id, { type: postType, content: postContent.trim(), mediaUrl: mediaPreview?.url || null });
    if (!result.ok) return store.toast(result.error, 'error');
    setPostContent('');
    setPostType('Text');
    setMediaPreview(null);
    store.toast('Posted to the community feed.', 'success');
  };

  const handleLike = (postId) => {
    if (!user) return;
    store.togglePostLike(postId, user.id);
  };

  const handleAddComment = (postId) => {
    const text = (commentDrafts[postId] || '').trim();
    if (!text || !user) return;
    store.addComment(postId, user.id, text);
    setCommentDrafts((d) => ({ ...d, [postId]: '' }));
  };

  const handlePin = (post) => {
    store.setPostPinned(post.id, !post.pinned);
    store.toast(post.pinned ? 'Post unpinned.' : 'Post pinned to top of feed.', 'success');
  };

  const handleRemovePost = (post) => {
    store.askConfirm({
      title: 'Remove this post?',
      message: 'The post will be hidden from the community feed immediately.',
      confirmLabel: 'Remove Post',
      tone: 'danger',
      onConfirm: () => {
        store.setPostStatus(post.id, 'REMOVED', user.id);
        store.toast('Post removed.', 'success');
      },
    });
  };

  const handleRegisterEvent = (event) => {
    const result = registerForEvent(event.id, user.id);
    if (!result.ok) return store.toast(result.error, 'error');
    store.toast(`You're registered for "${event.name}"!`, 'success');
  };

  const handleApprove = (member, approve) => {
    const result = approveMembership(member.id, approve, user.id);
    if (!result.ok) return store.toast(result.error, 'error');
    store.toast(approve ? 'Membership approved.' : 'Request declined.', 'success');
  };

  const handleBan = (member) => {
    const u = store.getUser(member.userId);
    store.askConfirm({
      title: `Remove ${u?.name} from the community?`,
      message: 'They will lose access to the feed, events and challenges of this community.',
      confirmLabel: 'Remove Member',
      tone: 'danger',
      onConfirm: () => {
        const result = banMember(member.id, user.id, 'Removed by community admin');
        if (!result.ok) return store.toast(result.error, 'error');
        store.toast(`${u?.name} was removed from the community.`, 'success');
      },
    });
  };

  const tabs = [
    { value: 'feed', label: 'Feed', count: posts.length },
    { value: 'events', label: 'Events', count: events.length },
    { value: 'challenges', label: 'Challenges', count: challenges.length },
    { value: 'members', label: 'Members', count: members.length },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
        <ArrowLeft className="size-4" /> Back
      </button>

      <Card className="overflow-hidden">
        <div className="h-16 bg-gradient-to-br from-brand-600 to-court-600" />
        <CardBody>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-ink-900">{community.name}</h1>
                <Badge tone={community.isPrivate ? 'neutral' : 'success'}>{community.isPrivate ? 'Private' : 'Public'}</Badge>
              </div>
              {community.description && <p className="mt-1 max-w-xl text-sm text-ink-500">{community.description}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-500">
                <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {community.location}</span>
                <Badge tone="neutral">{community.skillLevel}</Badge>
                <span className="flex items-center gap-1"><UsersIcon className="size-3.5" /> {members.length}{community.maxMembers ? `/${community.maxMembers}` : ''} members</span>
                <span>{posts.length} posts</span>
              </div>
            </div>
            <div className="shrink-0">
              {membership?.status === 'ACTIVE' ? (
                <Badge tone="brand">{ROLE_LABEL[membership.role] || 'Member'}</Badge>
              ) : membership?.status === 'PENDING' ? (
                <Badge tone="warning">Request Pending</Badge>
              ) : membership?.status === 'BANNED' ? (
                <Badge tone="danger">Restricted</Badge>
              ) : (
                <Button size="sm" onClick={handleJoin}>{joinLabel}</Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <Tabs className="mb-5 mt-6" tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'feed' && (
        <div className="space-y-4">
          {isActiveMember ? (
            <Card>
              <CardBody>
                <form onSubmit={handlePost} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar name={user?.name} size="sm" />
                    <Textarea className="flex-1" rows={3} value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder={`Share something with ${community.name}…`} />
                  </div>

                  {(postType === 'Photo' || postType === 'Video') && (
                    <div className="ml-11">
                      {!mediaPreview ? (
                        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-ink-300 px-3 py-2 text-xs font-medium text-ink-600 hover:border-brand-400 hover:text-brand-700">
                          {postType === 'Photo' ? <ImageIcon className="size-4" /> : <Video className="size-4" />}
                          Choose {postType === 'Photo' ? 'an image' : 'a video'} to attach
                          <input type="file" accept={postType === 'Photo' ? 'image/*' : 'video/*'} className="hidden" onChange={handleMediaChange} />
                        </label>
                      ) : (
                        <div className="relative inline-block">
                          {mediaPreview.kind === 'Photo' ? (
                            <img src={mediaPreview.url} alt="Attachment preview" className="max-h-48 rounded-lg border border-ink-200 object-cover" />
                          ) : (
                            <video src={mediaPreview.url} controls className="max-h-48 rounded-lg border border-ink-200" />
                          )}
                          <button
                            type="button"
                            onClick={() => setMediaPreview(null)}
                            className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-ink-900 text-white shadow hover:bg-ink-800"
                            title="Remove attachment"
                          >
                            <XIcon className="size-3.5" />
                          </button>
                        </div>
                      )}
                      {mediaError && <p className="mt-1 text-xs text-red-600">{mediaError}</p>}
                      <p className="mt-1 text-[11px] text-ink-400">Prototype note: attachments preview instantly but only last for this browser tab — they won't survive a page refresh (no real file storage backing this demo).</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Select className="w-40" value={postType} onChange={(e) => handlePostTypeChange(e.target.value)}>
                      {POST_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </Select>
                    <Button type="submit" size="sm">Post</Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          ) : (
            <EmptyState
              title="Join to post in this community"
              message="Members can share updates, photos and celebrate wins in the feed."
              action={membership?.status === 'PENDING' ? <Badge tone="warning">Request Pending</Badge> : membership?.status === 'BANNED' ? <Badge tone="danger">Restricted</Badge> : <Button onClick={handleJoin}>{joinLabel}</Button>}
            />
          )}

          {posts.length === 0 ? (
            <EmptyState title="No posts yet" message="Be the first to share something with this community." />
          ) : (
            posts.map((post) => {
              const author = store.getUser(post.userId);
              const likeCount = store.likesFor(post.id).length;
              const liked = user ? store.hasLiked(post.id, user.id) : false;
              const comments = store.commentsFor(post.id);
              return (
                <Card key={post.id}>
                  <CardBody className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <Avatar name={author?.name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-ink-800">{author?.name}</p>
                          <p className="text-xs text-ink-400">{timeAgo(post.createdAt)}{post.pinned ? ' · Pinned' : ''}</p>
                        </div>
                      </div>
                      {canModeratePosts && (
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => handlePin(post)} title={post.pinned ? 'Unpin post' : 'Pin post'} className={clsx('rounded-lg p-1.5 hover:bg-ink-100', post.pinned ? 'text-accent-600' : 'text-ink-400')}>
                            <Pin className="size-4" />
                          </button>
                          <button type="button" onClick={() => handleRemovePost(post)} title="Remove post" className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    {post.content && <p className="whitespace-pre-wrap text-sm text-ink-700">{post.content}</p>}
                    {post.mediaUrl && <PostMedia type={post.type} url={post.mediaUrl} />}
                    <div className="flex items-center gap-4 border-t border-ink-100 pt-3 text-xs text-ink-500">
                      <button type="button" onClick={() => handleLike(post.id)} className={clsx('flex items-center gap-1.5 hover:text-red-600', liked && 'text-red-600')}>
                        <Heart className={clsx('size-4', liked && 'fill-red-600')} /> {likeCount}
                      </button>
                      <span className="flex items-center gap-1.5"><MessageCircle className="size-4" /> {comments.length}</span>
                    </div>
                    {comments.length > 0 && (
                      <div className="space-y-2 border-t border-ink-100 pt-3">
                        {comments.map((c) => {
                          const cu = store.getUser(c.userId);
                          return (
                            <div key={c.id} className="flex items-start gap-2 text-sm">
                              <Avatar name={cu?.name} size="xs" />
                              <p><span className="font-medium text-ink-800">{cu?.name}</span> <span className="text-ink-600">{c.content}</span></p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {user && (
                      <form onSubmit={(e) => { e.preventDefault(); handleAddComment(post.id); }} className="flex items-center gap-2 pt-1">
                        <Input className="flex-1" value={commentDrafts[post.id] || ''} onChange={(e) => setCommentDrafts((d) => ({ ...d, [post.id]: e.target.value }))} placeholder="Add a comment…" />
                        <Button type="submit" size="sm" variant="secondary">Send</Button>
                      </form>
                    )}
                  </CardBody>
                </Card>
              );
            })
          )}
        </div>
      )}

      {tab === 'events' && (
        <div className="space-y-4">
          {canManageCommunity && (
            <div className="flex justify-end">
              <Button icon={PlusCircle} onClick={() => setEventModalOpen(true)}>Create Event</Button>
            </div>
          )}
          {events.length === 0 ? (
            <EmptyState icon={Calendar} title="No events scheduled" message="Check back later, or create one if you manage this community." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {events.map((ev) => {
                const participantCount = store.participantsFor(ev.id).length;
                const registered = user ? store.isRegisteredForEvent(ev.id, user.id) : false;
                const isFull = ev.status === 'FULL' || participantCount >= ev.maxParticipants;
                const isClosed = ['COMPLETED', 'CANCELLED'].includes(ev.status);
                return (
                  <Card key={ev.id}>
                    <CardBody className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-ink-900">{ev.name}</h3>
                        <Badge status={ev.status} />
                      </div>
                      {ev.description && <p className="text-xs text-ink-500">{ev.description}</p>}
                      <div className="space-y-1 text-xs text-ink-500">
                        <p className="flex items-center gap-1.5"><Calendar className="size-3.5" /> {formatDate(ev.date)}<Clock className="ml-2 size-3.5" /> {formatTime(ev.startTime)}</p>
                        <p className="flex items-center gap-1.5"><MapPin className="size-3.5" /> {ev.location}</p>
                        <p className="flex items-center gap-1.5"><UsersIcon className="size-3.5" /> {participantCount}/{ev.maxParticipants} registered</p>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-sm font-semibold text-ink-800">{ev.entryFee > 0 ? money(ev.entryFee) : 'Free'}</span>
                        <Button size="sm" variant={registered ? 'secondary' : 'primary'} disabled={registered || isFull || isClosed} onClick={() => handleRegisterEvent(ev)}>
                          {registered ? 'Registered' : isClosed ? 'Closed' : isFull ? 'Full' : 'Register'}
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'challenges' && (
        challenges.length === 0 ? (
          <EmptyState icon={Trophy} title="No challenges right now" message="Check back soon for new community challenges." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {challenges.map((c) => {
              const progress = user ? store.progressFor(c.id, user.id) : null;
              const current = progress?.current || 0;
              const completed = progress?.status === 'COMPLETED';
              return (
                <Card key={c.id}>
                  <CardBody className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-ink-900">{c.title}</h3>
                      {completed && <Badge tone="success">Completed</Badge>}
                    </div>
                    <p className="text-xs text-ink-500">{c.description}</p>
                    <ProgressBar value={current} max={c.targetValue} tone={completed ? 'brand' : 'court'} showLabel />
                    <div className="flex items-center justify-between text-xs text-ink-500">
                      <span className="flex items-center gap-1"><Award className="size-3.5" /> {c.reward}</span>
                      <span>Ends {formatDate(c.endDate)}</span>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )
      )}

      {tab === 'members' && (
        <div className="space-y-6">
          {canManageCommunity && pendingRequests.length > 0 && (
            <Card>
              <CardHeader title={`Pending Requests (${pendingRequests.length})`} />
              <CardBody className="space-y-2">
                {pendingRequests.map((m) => {
                  const u = store.getUser(m.userId);
                  return (
                    <div key={m.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u?.name} size="sm" />
                        <p className="text-sm font-medium text-ink-800">{u?.name}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" icon={Check} onClick={() => handleApprove(m, true)}>Approve</Button>
                        <Button size="sm" variant="outlineDanger" icon={XIcon} onClick={() => handleApprove(m, false)}>Decline</Button>
                      </div>
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title={`Members (${members.length})`} />
            <CardBody className="space-y-2">
              {members.length === 0 ? (
                <p className="text-sm text-ink-400">No active members yet.</p>
              ) : members.map((m) => {
                const u = store.getUser(m.userId);
                return (
                  <div key={m.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u?.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-ink-800">{u?.name}</p>
                        <p className="text-xs text-ink-400">{u?.skillLevel}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={m.role === 'OWNER' ? 'brand' : m.role === 'ADMIN' || m.role === 'MODERATOR' ? 'court' : 'neutral'}>{ROLE_LABEL[m.role] || m.role}</Badge>
                      {canManageCommunity && m.role !== 'OWNER' && m.userId !== user?.id && (
                        <button type="button" onClick={() => handleBan(m)} title="Remove member" className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600">
                          <ShieldBan className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>
        </div>
      )}

      <CreateEventModal open={eventModalOpen} onClose={() => setEventModalOpen(false)} communityId={community.id} organizerId={user?.id} />
    </div>
  );
}

/** Renders a post's attached photo/video. Blob-URL attachments only live for
 *  the browser tab that created them (no real file storage in this
 *  prototype), so a stale URL after reload falls back to a plain notice
 *  instead of a broken image icon. */
function PostMedia({ type, url }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-ink-200 bg-ink-50 px-3 py-4 text-xs text-ink-400">
        {type === 'Video' ? <Video className="size-4" /> : <ImageIcon className="size-4" />}
        {type === 'Video' ? 'Video' : 'Photo'} attachment is no longer available (prototype attachments don't persist across reloads).
      </div>
    );
  }

  return type === 'Video' ? (
    <video src={url} controls className="max-h-72 w-full rounded-lg border border-ink-200 bg-black" onError={() => setFailed(true)} />
  ) : (
    <img src={url} alt="Post attachment" className="max-h-72 w-full rounded-lg border border-ink-200 object-cover" onError={() => setFailed(true)} />
  );
}
