/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sonora Demo Data Layer
 * Realistic seed data directly aligned with the visual showcase and Song DNA architecture.
 */

import {
  UserProfile,
  Post,
  Song,
  SongVersion,
  Contribution,
  CollaborationRequest,
  Conversation,
  CollaborationEvent,
  FollowRelationship,
  FriendRequest,
  Friendship,
  Comment,
} from '../types/models';

export const CURRENT_USER: UserProfile = {
  id: 'user_current',
  username: 'ayush.sound',
  displayName: 'Ayush Singh',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  bio: 'Multi-instrumentalist & beat crafter. Searching for soulful vocalists and horn players for collaborative jams.',
  location: 'San Francisco, CA',
  instruments: ['Guitar', 'Beats', 'Keys'],
  genres: ['Indie', 'Hip Hop', 'R&B'],
  interests: ['Song DNA Stems', 'Lo-fi Jamming', 'Acoustic Sessions'],
  isProfilePublic: true,
  isOpenForCollab: true,
  stats: {
    followersCount: 1240,
    followingCount: 382,
    friendsCount: 94,
    collabsCount: 23,
    songDnaLineagesCount: 7,
  },
};

export const ARTISTS: Record<string, UserProfile> = {
  bryanthemensah: {
    id: 'user_bryanthemensah',
    username: 'bryanthemensah',
    displayName: 'BRYAN THE MENSAH',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
    bio: 'Artist, songwriter and vocalist. Collab with me!',
    location: 'Accra / London',
    instruments: ['Vocals', 'Keys', 'Production'],
    genres: ['Afro-fusion', 'Indie', 'Hip Hop'],
    interests: ['Live Vocal Stems', 'Beat Swaps', 'Song DNA Lineages'],
    isProfilePublic: true,
    isOpenForCollab: true,
    socialLinks: {
      twitter: 'https://twitter.com',
      instagram: 'https://instagram.com',
      soundcloud: 'https://soundcloud.com',
      youtube: 'https://youtube.com',
      spotify: 'https://spotify.com',
    },
    stats: {
      followersCount: 14200,
      followingCount: 420,
      friendsCount: 156,
      collabsCount: 89,
      songDnaLineagesCount: 12,
    },
  },
  'rhea.vocals': {
    id: 'user_rhea',
    username: 'rhea.vocals',
    displayName: 'Rhea Sharma',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80',
    bio: 'Singer-songwriter & folk indie vocalist. Harmonizing late into the night.',
    location: 'Seattle, WA',
    instruments: ['Vocals', 'Guitar'],
    genres: ['Indie', 'Acoustic', 'Pop'],
    interests: ['Acoustic Folk', 'Vocal Harmonies'],
    isProfilePublic: true,
    isOpenForCollab: true,
    socialLinks: {
      twitter: 'https://twitter.com',
      instagram: 'https://instagram.com',
      spotify: 'https://spotify.com',
    },
    stats: {
      followersCount: 8400,
      followingCount: 310,
      friendsCount: 112,
      collabsCount: 45,
      songDnaLineagesCount: 9,
    },
  },
  'arjun.gtr': {
    id: 'user_arjun',
    username: 'arjun.gtr',
    displayName: 'Arjun Mehta',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80',
    bio: 'Fender Strat obsessive. Writing riffs that need drums and soulful top-lines.',
    location: 'Austin, TX',
    instruments: ['Guitar', 'Bass'],
    genres: ['Rock', 'Indie', 'Funk'],
    interests: ['Riff Stems', 'Analog Pedals'],
    isProfilePublic: true,
    isOpenForCollab: true,
    socialLinks: {
      instagram: 'https://instagram.com',
      youtube: 'https://youtube.com',
      spotify: 'https://spotify.com',
    },
    stats: {
      followersCount: 6200,
      followingCount: 280,
      friendsCount: 88,
      collabsCount: 34,
      songDnaLineagesCount: 6,
    },
  },
  'maya.keys': {
    id: 'user_maya',
    username: 'maya.keys',
    displayName: 'Maya Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1520523839898-507127050302?w=1200&auto=format&fit=crop&q=80',
    bio: 'Neo-soul pianist & synth explorer. Rhodes, Prophet 6 & smooth progressions.',
    location: 'Toronto, ON',
    instruments: ['Keys', 'Piano', 'Synth'],
    genres: ['R&B', 'Jazz', 'Pop'],
    interests: ['Neo-soul Chords', 'Synth Leads'],
    isProfilePublic: true,
    isOpenForCollab: true,
    socialLinks: {
      instagram: 'https://instagram.com',
      soundcloud: 'https://soundcloud.com',
      spotify: 'https://spotify.com',
    },
    stats: {
      followersCount: 11300,
      followingCount: 390,
      friendsCount: 140,
      collabsCount: 52,
      songDnaLineagesCount: 11,
    },
  },
  beatsbydev: {
    id: 'user_dev',
    username: 'beatsbydev',
    displayName: 'Devon Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&auto=format&fit=crop&q=80',
    bio: 'Boom bap & trap producer. MPC 2000XL groove with modern crisp bounce.',
    location: 'Atlanta, GA',
    instruments: ['Beats', 'Drums', 'Production'],
    genres: ['Hip Hop', 'R&B', 'Electronic'],
    interests: ['Sample Flips', '808 Stems'],
    isProfilePublic: true,
    isOpenForCollab: true,
    socialLinks: {
      twitter: 'https://twitter.com',
      soundcloud: 'https://soundcloud.com',
      spotify: 'https://spotify.com',
    },
    stats: {
      followersCount: 19800,
      followingCount: 512,
      friendsCount: 198,
      collabsCount: 78,
      songDnaLineagesCount: 15,
    },
  },
  'marcus.bass': {
    id: 'user_marcus',
    username: 'marcus.bass',
    displayName: 'Marcus Cole',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    bio: 'P-Bass, 5-string groove, & Moog synth basslines. Keeping the pocket deep and tight.',
    location: 'Chicago, IL',
    instruments: ['Bass', 'Synth', 'Keys'],
    genres: ['R&B', 'Funk', 'Neo-soul'],
    interests: ['Pocket Grooves', 'Bass Lineages', 'Live Jamming'],
    isProfilePublic: false, // Private profile state for testing privacy & friendship boundaries
    isOpenForCollab: true,
    socialLinks: {
      instagram: 'https://instagram.com',
      spotify: 'https://spotify.com',
    },
    stats: {
      followersCount: 5200,
      followingCount: 195,
      friendsCount: 64,
      collabsCount: 29,
      songDnaLineagesCount: 5,
    },
  },
};

/**
 * 4 Core Demo Musicians for User Switching
 * 1. Singer/Songwriter: Bryan The Mensah
 * 2. Guitarist: Arjun Mehta
 * 3. Vocalist: Rhea Sharma
 * 4. Bassist: Marcus Cole
 */
export const PRIMARY_DEMO_KEYS = [
  'bryanthemensah',
  'arjun.gtr',
  'rhea.vocals',
  'marcus.bass',
] as const;

/**
 * Demo Songs & Song DNA Lineage
 */
export const DEMO_SONGS: Song[] = [
  {
    id: 'song_latenight',
    title: 'Late Night Riff',
    originalCreatorId: 'user_rhea',
    originalPostId: 'post_rhea_1',
    lineageIdentifier: 'dna_lineage_001',
    totalLineageAdditions: 14, // Rule 5: aggregate across all branches
    rootCreatedAt: '2026-10-10T19:30:00Z',
  },
  {
    id: 'song_demo_splitscreen',
    title: '4-Way Split Screen Jam',
    originalCreatorId: 'user_bryanthemensah',
    originalPostId: 'post_demo_split_screen',
    lineageIdentifier: 'dna_demo_splitscreen_004',
    totalLineageAdditions: 1, // Preloaded split-screen video treated as one original contribution
    rootCreatedAt: '2026-10-12T12:00:00Z',
  },
  {
    id: 'song_somethin',
    title: "Somethin'",
    originalCreatorId: 'user_bryanthemensah',
    originalPostId: 'post_bryan_1',
    lineageIdentifier: 'dna_lineage_002',
    totalLineageAdditions: 27,
    rootCreatedAt: '2026-10-01T12:00:00Z',
  },
];

export const DEMO_SONG_VERSIONS: SongVersion[] = [
  {
    id: 'version_root_001',
    songId: 'song_latenight',
    parentVersionId: null,
    versionNumber: 1.0,
    versionLabel: 'Original Acoustic Idea',
    orderedContributionIds: ['contrib_rhea_vox', 'contrib_rhea_gtr'],
    createdAt: '2026-10-10T19:30:00Z',
    createdByUserId: 'user_rhea',
    changelogDescription: 'Root acoustic guitar riff and vocal topline melody recorded late night.',
  },
  {
    id: 'version_branch_002',
    songId: 'song_latenight',
    parentVersionId: 'version_root_001',
    versionNumber: 1.1,
    versionLabel: 'Acoustic + Arjun Lead Guitar',
    orderedContributionIds: ['contrib_rhea_vox', 'contrib_rhea_gtr', 'contrib_arjun_solo'],
    createdAt: '2026-10-11T14:15:00Z',
    createdByUserId: 'user_arjun',
    changelogDescription: 'Added bluesy Stratocaster lead fills over the verse.',
  },
  {
    id: 'version_branch_003',
    songId: 'song_latenight',
    parentVersionId: 'version_branch_002',
    versionNumber: 2.0,
    versionLabel: 'Full Band Arrangement',
    orderedContributionIds: ['contrib_rhea_vox', 'contrib_rhea_gtr', 'contrib_arjun_solo', 'contrib_dev_drums', 'contrib_maya_keys'],
    createdAt: '2026-10-12T20:00:00Z',
    createdByUserId: 'user_dev',
    changelogDescription: 'Added lo-fi acoustic drums and Rhodes chords. 5 active parts.',
  },
  {
    id: 'ver_demo_splitscreen_v1',
    songId: 'song_demo_splitscreen',
    parentVersionId: null,
    versionNumber: 1.0,
    versionLabel: 'Original 4-Way Jam Video Take',
    orderedContributionIds: ['contrib_demo_splitscreen_root'],
    createdAt: '2026-10-12T12:00:00Z',
    createdByUserId: 'user_bryanthemensah',
    changelogDescription: 'Prerecorded 4-person split-screen jam recorded in one live take.',
  },
  {
    id: 'version_somethin_v1',
    songId: 'song_somethin',
    parentVersionId: null,
    versionNumber: 1.0,
    versionLabel: 'Afro-Indie Groove Root',
    orderedContributionIds: ['contrib_bryan_somethin_vox', 'contrib_marcus_bass'],
    createdAt: '2026-10-01T12:00:00Z',
    createdByUserId: 'user_bryanthemensah',
    changelogDescription: 'Root Afro-fusion groove with Bryan vocal lead and Marcus bassline.',
  },
];

export const DEMO_CONTRIBUTIONS: Contribution[] = [
  {
    id: 'contrib_demo_splitscreen_root',
    songId: 'song_demo_splitscreen',
    versionId: 'ver_demo_splitscreen_v1',
    contributorId: 'user_bryanthemensah',
    partType: 'Vocals',
    audioReference: { type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-drummer-playing-drums-in-a-concert-42513-large.mp4' },
    videoReference: { type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-drummer-playing-drums-in-a-concert-42513-large.mp4' },
    orderIndex: 0,
    isOriginalStem: true,
    createdAt: '2026-10-12T12:00:00Z',
  },
  {
    id: 'contrib_rhea_vox',
    songId: 'song_latenight',
    versionId: 'version_root_001',
    contributorId: 'user_rhea',
    partType: 'Vocals',
    audioReference: { type: 'audio', url: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3' },
    videoReference: { type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-singer-singing-into-a-microphone-in-a-studio-42514-large.mp4' },
    orderIndex: 0,
    isOriginalStem: true,
    createdAt: '2026-10-10T19:30:00Z',
  },
  {
    id: 'contrib_rhea_gtr',
    songId: 'song_latenight',
    versionId: 'version_root_001',
    contributorId: 'user_rhea',
    partType: 'Guitar',
    audioReference: { type: 'audio', url: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3' },
    videoReference: { type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-guitarist-playing-a-guitar-42512-large.mp4' },
    orderIndex: 1,
    isOriginalStem: true,
    createdAt: '2026-10-10T19:30:00Z',
  },
  {
    id: 'contrib_arjun_solo',
    songId: 'song_latenight',
    versionId: 'version_branch_002',
    contributorId: 'user_arjun',
    partType: 'Guitar',
    audioReference: { type: 'audio', url: 'https://assets.mixkit.co/music/preview/mixkit-sleepy-cat-135.mp3' },
    videoReference: { type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-guitarist-playing-a-guitar-42512-large.mp4' },
    orderIndex: 2,
    isOriginalStem: false,
    createdAt: '2026-10-11T14:15:00Z',
  },
  {
    id: 'contrib_dev_drums',
    songId: 'song_latenight',
    versionId: 'version_branch_003',
    contributorId: 'user_dev',
    partType: 'Drums',
    audioReference: { type: 'audio', url: 'https://assets.mixkit.co/music/preview/mixkit-hollidays-690.mp3' },
    videoReference: { type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-drummer-playing-drums-in-a-concert-42513-large.mp4' },
    orderIndex: 3,
    isOriginalStem: false,
    createdAt: '2026-10-12T20:00:00Z',
  },
  {
    id: 'contrib_maya_keys',
    songId: 'song_latenight',
    versionId: 'version_branch_003',
    contributorId: 'user_maya',
    partType: 'Keyboard',
    audioReference: { type: 'audio', url: 'https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.mp3' },
    videoReference: { type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-playing-piano-keys-in-a-studio-42515-large.mp4' },
    orderIndex: 4,
    isOriginalStem: false,
    createdAt: '2026-10-12T20:00:00Z',
  },
  {
    id: 'contrib_bryan_somethin_vox',
    songId: 'song_somethin',
    versionId: 'version_somethin_v1',
    contributorId: 'user_bryanthemensah',
    partType: 'Vocals',
    audioReference: { type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-singer-singing-into-a-microphone-in-a-studio-42514-large.mp4' },
    videoReference: { type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-singer-singing-into-a-microphone-in-a-studio-42514-large.mp4' },
    orderIndex: 0,
    isOriginalStem: true,
    createdAt: '2026-10-01T12:00:00Z',
  },
  {
    id: 'contrib_marcus_bass',
    songId: 'song_somethin',
    versionId: 'version_somethin_v1',
    contributorId: 'user_marcus',
    partType: 'Bass',
    audioReference: { type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-man-playing-a-synthesizer-in-a-recording-studio-42516-large.mp4' },
    videoReference: { type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-man-playing-a-synthesizer-in-a-recording-studio-42516-large.mp4' },
    orderIndex: 1,
    isOriginalStem: false,
    createdAt: '2026-10-01T14:30:00Z',
  },
];

/**
 * Feed Posts for Circle
 */
export const DEMO_POSTS: Post[] = [
  {
    id: 'post_demo_split_screen',
    creatorId: 'user_bryanthemensah',
    postType: 'video',
    caption: 'Official 4-Way Split Screen Jam 🎶 4 musicians collaborating in a synchronized multi-frame performance.\n#TryDemo #SplitScreen #SongDNA #Collab',
    tags: ['TryDemo', 'SplitScreen', 'SongDNA', 'Collab'],
    media: [
      {
        type: 'video',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-drummer-playing-drums-in-a-concert-42513-large.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        durationSeconds: 48,
      },
    ],
    createdAt: 'Featured Demo',
    likesCount: 16800,
    commentsCount: 520,
    sharesCount: 2340,
    isLikedByCurrentUser: true,
    songId: 'song_demo_splitscreen',
    versionId: 'ver_demo_splitscreen_v1',
    isDemoPost: true,
  },
  {
    id: 'post_rhea_1',
    creatorId: 'user_rhea',
    postType: 'video',
    caption: 'Late night riff ✨\n#original #guitar #indie #collab',
    tags: ['original', 'guitar', 'indie', 'collab'],
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
        durationSeconds: 42,
      },
    ],
    createdAt: '2 hours ago',
    likesCount: 12400,
    commentsCount: 342,
    sharesCount: 1100,
    isLikedByCurrentUser: true,
    songId: 'song_latenight',
    versionId: 'version_branch_003',
  },
  {
    id: 'post_bryan_1',
    creatorId: 'user_bryanthemensah',
    postType: 'video',
    caption: 'Working on this new Afro-indie groove. Need bass and brass lines! Open for Collab.',
    tags: ['vocals', 'afrofusion', 'openforcollab'],
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
        durationSeconds: 58,
      },
    ],
    createdAt: '5 hours ago',
    likesCount: 8900,
    commentsCount: 198,
    sharesCount: 450,
    songId: 'song_somethin',
    versionId: 'version_somethin_v1',
  },
  {
    id: 'post_arjun_1',
    creatorId: 'user_arjun',
    postType: 'jam',
    caption: 'Funky D-minor progression jamming with Maya. Who has a saxophone?',
    tags: ['funk', 'stratocaster', 'jam'],
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
        durationSeconds: 30,
      },
    ],
    createdAt: 'Yesterday',
    likesCount: 4200,
    commentsCount: 88,
    sharesCount: 130,
  },
  {
    id: 'post_marcus_1',
    creatorId: 'user_marcus',
    postType: 'video',
    caption: 'Laid down the sub-bass pocket for the upcoming soul track. Who is adding drums and horns?',
    tags: ['bass', 'pocket', 'neosoul', 'groove'],
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
        durationSeconds: 38,
      },
    ],
    createdAt: '3 days ago',
    likesCount: 3100,
    commentsCount: 64,
    sharesCount: 92,
  },
];

/**
 * Link Conversations
 */
export const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1',
    participantIds: ['user_current', 'user_rhea'],
    unreadCount: 0,
    isGroup: false,
    updatedAt: '2m',
    lastMessage: {
      id: 'msg_1',
      conversationId: 'conv_1',
      senderId: 'user_rhea',
      text: 'this riff is sick! wanna jam?',
      createdAt: '2m ago',
      isRead: true,
    },
  },
  {
    id: 'conv_2',
    participantIds: ['user_current', 'user_arjun'],
    unreadCount: 1,
    isGroup: false,
    updatedAt: '12m',
    lastMessage: {
      id: 'msg_2',
      conversationId: 'conv_2',
      senderId: 'user_arjun',
      text: 'Sent a guitar sample',
      createdAt: '12m ago',
      isRead: false,
    },
  },
  {
    id: 'conv_3',
    participantIds: ['user_current', 'user_maya'],
    unreadCount: 0,
    isGroup: false,
    updatedAt: '44m',
    lastMessage: {
      id: 'msg_3',
      conversationId: 'conv_3',
      senderId: 'user_maya',
      text: "Let's do a collab on this 🎹",
      createdAt: '44m ago',
      isRead: true,
    },
  },
  {
    id: 'conv_4',
    participantIds: ['user_current', 'user_dev'],
    unreadCount: 0,
    isGroup: false,
    updatedAt: '1h',
    lastMessage: {
      id: 'msg_4',
      conversationId: 'conv_4',
      senderId: 'user_dev',
      text: 'New beat idea for you',
      createdAt: '1h ago',
      isRead: true,
    },
  },
  {
    id: 'conv_5',
    participantIds: ['user_current', 'user_arjun', 'user_maya'],
    unreadCount: 0,
    isGroup: true,
    groupName: 'theindiecollective',
    updatedAt: '3h',
    lastMessage: {
      id: 'msg_5',
      conversationId: 'conv_5',
      senderId: 'user_maya',
      text: '3 members • Next jam Sat 6PM',
      createdAt: '3h ago',
      isRead: true,
    },
  },
  {
    id: 'conv_6',
    participantIds: ['user_current', 'user_bryanthemensah'],
    unreadCount: 0,
    isGroup: false,
    updatedAt: '1d',
    lastMessage: {
      id: 'msg_6',
      conversationId: 'conv_6',
      senderId: 'user_bryanthemensah',
      text: 'Shared a project',
      createdAt: '1d ago',
      isRead: true,
    },
  },
];

/**
 * Collaboration Requests
 */
export const DEMO_COLLAB_REQUESTS: CollaborationRequest[] = [
  {
    id: 'collab_req_1',
    senderId: 'user_arjun',
    recipientId: 'user_current',
    proposedPart: 'Guitar',
    songId: 'song_latenight',
    status: 'pending',
    message: 'Hey, I laid down some rhythm chords that would fit your acoustic loop. Check out the stem!',
    createdAt: '15m ago',
  },
  {
    id: 'collab_req_2',
    senderId: 'user_maya',
    recipientId: 'user_current',
    proposedPart: 'Keys',
    status: 'pending',
    message: 'Would love to record Rhodes chords for your upcoming indie project.',
    createdAt: '2h ago',
  },
  {
    id: 'collab_req_3',
    senderId: 'user_dev',
    recipientId: 'user_current',
    proposedPart: 'Beats',
    status: 'accepted',
    message: 'Let’s sync this boom-bap rhythm into your Song DNA branch.',
    createdAt: 'Yesterday',
  },
];

/**
 * Scheduled Collaboration Events
 */
export const DEMO_SCHEDULED_EVENTS: CollaborationEvent[] = [
  {
    id: 'event_1',
    title: 'Indie Collective Live Jam Session',
    participants: ['user_current', 'user_arjun', 'user_maya'],
    scheduledTime: 'Saturday, 6:00 PM',
    durationMinutes: 90,
    instrument: 'Guitar',
    genre: 'Indie',
    eventStatus: 'scheduled',
  },
  {
    id: 'event_2',
    title: 'Song DNA Stems Sync: Late Night Riff',
    participants: ['user_current', 'user_rhea'],
    scheduledTime: 'Sunday, 4:00 PM',
    durationMinutes: 45,
    instrument: 'Vocals',
    genre: 'Acoustic',
    eventStatus: 'scheduled',
  },
];

/**
 * Explore Reels & Discover Cards
 */
export const DEMO_EXPLORE_REELS = [
  {
    id: 'reel_1',
    title: 'Acoustic Harmonies in D',
    artist: 'rhea.vocals',
    views: '24.1K',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
    genre: 'Indie',
    part: 'Vocals',
  },
  {
    id: 'reel_2',
    title: 'Late Night Strat Solo',
    artist: 'arjun.gtr',
    views: '18.6K',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    genre: 'Rock',
    part: 'Guitar',
  },
  {
    id: 'reel_3',
    title: 'Stage Live Vocals',
    artist: 'bryanthemensah',
    views: '32.4K',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    genre: 'Afro-fusion',
    part: 'Vocals',
  },
  {
    id: 'reel_4',
    title: 'Lo-fi Rhodes Chord Swells',
    artist: 'maya.keys',
    views: '29.8K',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    genre: 'R&B',
    part: 'Keys',
  },
];

/**
 * Initial Social Relationships for Demo Testing
 */
export const DEMO_FOLLOWS: FollowRelationship[] = [
  // Bryan follows Rhea
  {
    id: 'follow_bryan_rhea',
    followerId: 'user_bryanthemensah',
    followedUserId: 'user_rhea',
    createdAt: '2026-10-01T10:00:00Z',
  },
  // Arjun follows Bryan
  {
    id: 'follow_arjun_bryan',
    followerId: 'user_arjun',
    followedUserId: 'user_bryanthemensah',
    createdAt: '2026-10-02T11:00:00Z',
  },
  // Marcus follows Arjun
  {
    id: 'follow_marcus_arjun',
    followerId: 'user_marcus',
    followedUserId: 'user_arjun',
    createdAt: '2026-10-03T12:00:00Z',
  },
];

export const DEMO_FRIENDSHIPS: Friendship[] = [
  // Mutual Friendship between Bryan The Mensah & Arjun Mehta
  {
    id: 'friendship_bryan_arjun',
    participantAId: 'user_bryanthemensah',
    participantBId: 'user_arjun',
    createdAt: '2026-10-05T14:30:00Z',
  },
];

export const DEMO_FRIEND_REQUESTS: FriendRequest[] = [
  // Outgoing request from Rhea Sharma to Bryan The Mensah (so Bryan sees an incoming request!)
  {
    id: 'freq_rhea_bryan',
    senderId: 'user_rhea',
    recipientId: 'user_bryanthemensah',
    status: 'pending',
    createdAt: '2026-10-12T09:15:00Z',
  },
  // Outgoing request from Marcus Cole to Bryan The Mensah
  {
    id: 'freq_marcus_bryan',
    senderId: 'user_marcus',
    recipientId: 'user_bryanthemensah',
    status: 'pending',
    createdAt: '2026-10-13T10:00:00Z',
  },
];

export const DEMO_COMMENTS: Comment[] = [
  {
    id: 'comm_split_1',
    postId: 'post_demo_split_screen',
    authorId: 'user_rhea',
    text: 'The 4-way sync on this is insane! Love how each part has its own sonic space 🧬🔥',
    createdAt: '1 hour ago',
  },
  {
    id: 'comm_split_2',
    postId: 'post_demo_split_screen',
    authorId: 'user_arjun',
    text: "The groove locks right in around 0:15. Can't wait to add another guitar layer!",
    createdAt: '45 mins ago',
  },
  {
    id: 'comm_split_3',
    postId: 'post_demo_split_screen',
    authorId: 'user_marcus',
    text: 'Bassline feeling extra deep in this mix. Proud to be part of this lineage 🎸',
    createdAt: '20 mins ago',
  },
  {
    id: 'comm_rhea_1',
    postId: 'post_rhea_1',
    authorId: 'user_bryanthemensah',
    text: 'Those vocal harmonies in the second verse give me chills ✨',
    createdAt: '2 hours ago',
  },
  {
    id: 'comm_rhea_2',
    postId: 'post_rhea_1',
    authorId: 'user_arjun',
    text: 'Added my Strat riff to this branch! Check the DNA timeline 🎶',
    createdAt: '1 hour ago',
  },
  {
    id: 'comm_bryan_1',
    postId: 'post_bryan_1',
    authorId: 'user_dev',
    text: 'This Afro-indie groove is infectious! Laying down drum stems on it right now 🥁',
    createdAt: '3 hours ago',
  },
  {
    id: 'comm_arjun_1',
    postId: 'post_arjun_1',
    authorId: 'user_maya',
    text: "Loved jamming on this progression yesterday! Let's get saxophone on it next 🎷",
    createdAt: 'Yesterday',
  },
  {
    id: 'comm_marcus_1',
    postId: 'post_marcus_1',
    authorId: 'user_dev',
    text: 'Pocket is huge bro, laying down kicks and hats right now 🔥',
    createdAt: '2 days ago',
  },
];
