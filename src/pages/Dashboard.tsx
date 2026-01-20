import React, { useState, useCallback, useEffect } from 'react';
import { Box, Container, Paper, Alert, Typography, CircularProgress, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, AppBar, Toolbar, TextField, Card, CardContent, Avatar, Dialog, DialogTitle, DialogContent, IconButton, Pagination, Select, MenuItem, FormControl, ImageList, ImageListItem, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Switch, FormControlLabel } from '@mui/material';
import { Close as CloseIcon, Visibility as VisibilityIcon, CalendarToday as CalendarIcon, Delete as DeleteIcon, Menu as MenuIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, People as PeopleIcon, AdminPanelSettings as AdminPanelSettingsIcon, Support as SupportIcon, Report as ReportIcon, CardGiftcard as CardGiftcardIcon, Block as BlockIcon, PostAdd as PostAddIcon, Comment as CommentIcon, Analytics as AnalyticsIcon, Home as HomeIcon, Settings as SettingsIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase, getUsers, getPlayers, getSupportRequests, getReports, getUserPosts, getUserComments, deletePost, deleteComment, sendNotification, getUserNotifications, updateSupportRequestStatus, updateReportStatus, deleteReport, getReferralCodes, getReferralRedemptions, deleteSupportRequest, getUserById, getBannedUsers, banUser, unbanUser, getOnboardingAnalytics, getUserStats, getSubscriptionStats, getSupportStats, getReportStats, getPopularReferralCodes, getCommunityStats, UserStats, SubscriptionStats, SupportStats, ReportStats, ReferralCodeStats, CommunityStats } from '../lib/mockData';
import { getSupportScreenshotUrl } from '../lib/supabase';

// Screenshot Display Component
const ScreenshotDisplay = ({ screenshotPath }: { screenshotPath: string }) => {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const loadScreenshot = async () => {
      try {
        setLoading(true);
        setError(false);
        console.log('Loading screenshot for path:', screenshotPath);
        console.log('Screenshot path type:', typeof screenshotPath);
        console.log('Screenshot path length:', screenshotPath?.length);
        
        const url = await getSupportScreenshotUrl(screenshotPath);
        console.log('Screenshot URL loaded:', url);
        console.log('URL type:', typeof url);
        console.log('URL length:', url?.length);
        
        if (url) {
          setScreenshotUrl(url);
        } else {
          console.error('No URL returned from getSupportScreenshotUrl');
          setError(true);
        }
      } catch (err) {
        console.error('Error loading screenshot:', err);
        console.error('Error type:', typeof err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadScreenshot();
  }, [screenshotPath]);

  if (loading) {
    return (
      <Box>
        <Typography variant="body2" sx={{ color: '#cccccc', mb: 0.5 }}>
          Screenshot:
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress size={30} sx={{ color: '#A9E5BB' }} />
        </Box>
      </Box>
    );
  }

  if (error || !screenshotUrl) {
    return (
      <Box>
        <Typography variant="body2" sx={{ color: '#cccccc', mb: 0.5 }}>
          Screenshot:
        </Typography>
        <Box sx={{ mt: 1, p: 2, backgroundColor: '#1a1a1a', borderRadius: 1, border: '1px solid #333333' }}>
          <Typography variant="body2" sx={{ color: '#666666', textAlign: 'center' }}>
            Failed to load screenshot
          </Typography>
          <Typography variant="caption" sx={{ color: '#888888', textAlign: 'center', display: 'block', mt: 1 }}>
            File may be corrupted or in unsupported format
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ color: '#cccccc', mb: 0.5 }}>
        Screenshot:
      </Typography>
      <Box sx={{ mt: 1 }}>
        <ImageList sx={{ width: '100%', maxHeight: expanded ? 'none' : 400 }} cols={1} rowHeight={expanded ? 'auto' : 300}>
          <ImageListItem>
            <img
              src={screenshotUrl}
              alt="Support request screenshot"
              loading="lazy"
              style={{
                width: '100%',
                height: expanded ? 'auto' : '100%',
                objectFit: expanded ? 'contain' : 'contain',
                borderRadius: '8px',
                border: '1px solid #333333',
                cursor: 'pointer'
              }}
              onClick={() => setExpanded(!expanded)}
              onError={(e) => {
                console.error('Error loading screenshot image:', e);
                console.error('Image error details:', {
                  src: e.currentTarget.src,
                  naturalWidth: e.currentTarget.naturalWidth,
                  naturalHeight: e.currentTarget.naturalHeight,
                  complete: e.currentTarget.complete
                });
                
                // Try to fetch the image to see what the actual error is
                fetch(e.currentTarget.src)
                  .then(response => {
                    console.log('Image fetch response:', {
                      status: response.status,
                      statusText: response.statusText,
                      headers: Object.fromEntries(response.headers.entries())
                    });
                    
                    // Check if it's a content-type issue
                    const contentType = response.headers.get('content-type');
                    console.log('Content-Type:', contentType);
                    
                    if (contentType && !contentType.startsWith('image/')) {
                      console.error('File is not an image! Content-Type:', contentType);
                    }
                  })
                  .catch(fetchError => {
                    console.error('Image fetch error:', fetchError);
                  });
                
                setError(true);
              }}
              onLoad={() => {
                console.log('Screenshot loaded successfully');
              }}
            />
          </ImageListItem>
        </ImageList>
        <Box sx={{ mt: 1, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#888888' }}>
            {expanded ? 'Click to collapse' : 'Click to expand'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const Dashboard = () => {
  const { user, loading, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [users, setUsers] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [supportRequests, setSupportRequests] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [playerSearchTerm, setPlayerSearchTerm] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState<boolean>(false);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userComments, setUserComments] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState<boolean>(false);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [usersPage, setUsersPage] = useState<number>(1);
  const [playersPage, setPlayersPage] = useState<number>(1);
  const usersPerPage = 10;
  
  // Notification state
  const [notificationTitle, setNotificationTitle] = useState<string>('');
  const [notificationMessage, setNotificationMessage] = useState<string>('');
  const [sendingNotification, setSendingNotification] = useState<boolean>(false);
  const [previousNotifications, setPreviousNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState<boolean>(false);
  
  // Engagement posts state
  const [engagementPosts, setEngagementPosts] = useState<any[]>([]);
  const [engagementPostsLoading, setEngagementPostsLoading] = useState<boolean>(false);
  const [newEngagementPost, setNewEngagementPost] = useState({
    content: '',
    username: '',
    avatarColor: '#CBB3FF',
    likeCount: 0,
    delayHours: 0
  });
  const [creatingEngagementPost, setCreatingEngagementPost] = useState<boolean>(false);
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [showScheduledPosts, setShowScheduledPosts] = useState<boolean>(false);
  const [scheduledPostsLoading, setScheduledPostsLoading] = useState<boolean>(false);
  const [editingLikeCount, setEditingLikeCount] = useState<string | null>(null);
  const [newLikeCount, setNewLikeCount] = useState<number>(0);
  
  // Engagement Comments state
  const [selectedPostForComments, setSelectedPostForComments] = useState<any>(null);
  const [commentsModalOpen, setCommentsModalOpen] = useState<boolean>(false);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [postCommentsLoading, setPostCommentsLoading] = useState<boolean>(false);
  
  // iOS Update System state
  const [iosUpdateSettings, setIosUpdateSettings] = useState<any>({
    force_update_enabled: false,
    custom_message: 'A new version of Momu is available. Please update to continue using the app.',
    current_version: '1.0.6',
    latest_version: '1.0.6'
  });
  const [iosUpdateLoading, setIosUpdateLoading] = useState<boolean>(false);
  const [iosUpdateSaving, setIosUpdateSaving] = useState<boolean>(false);
  const [newEngagementComment, setNewEngagementComment] = useState({
    content: '',
    username: '',
    avatarColor: '#CBB3FF',
    likeCount: 0
  });
  const [creatingEngagementComment, setCreatingEngagementComment] = useState<boolean>(false);
  
  // Engagement Comments Tab state
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [allPostsLoading, setAllPostsLoading] = useState<boolean>(false);
  const [postFilter, setPostFilter] = useState<'all' | 'engagement'>('all');
  const [selectedPostForCommenting, setSelectedPostForCommenting] = useState<any>(null);
  const [commentModalOpen, setCommentModalOpen] = useState<boolean>(false);
  const [newComment, setNewComment] = useState({
    content: '',
    username: '',
    avatarColor: '#CBB3FF',
    likeCount: 0
  });
  const [creatingComment, setCreatingComment] = useState<boolean>(false);
  
  // Support request modal state
  const [selectedSupportRequest, setSelectedSupportRequest] = useState<any>(null);
  const [supportRequestModalOpen, setSupportRequestModalOpen] = useState<boolean>(false);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [deletingSupportRequest, setDeletingSupportRequest] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [supportRequestUser, setSupportRequestUser] = useState<any>(null);
  const [supportRequestUserLoading, setSupportRequestUserLoading] = useState<boolean>(false);
  
  // Report modal state
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [reportedContent, setReportedContent] = useState<any>(null);
  const [reportedContentLoading, setReportedContentLoading] = useState<boolean>(false);
  const [reporterUser, setReporterUser] = useState<any>(null);
  const [reporterUserLoading, setReporterUserLoading] = useState<boolean>(false);
  const [reportedUser, setReportedUser] = useState<any>(null);
  const [reportedUserLoading, setReportedUserLoading] = useState<boolean>(false);
  const [deletingReport, setDeletingReport] = useState<boolean>(false);
  
  // Referral state
  const [referralCodes, setReferralCodes] = useState<any[]>([]);
  const [referralCodesLoading, setReferralCodesLoading] = useState<boolean>(false);
  const [selectedReferralCode, setSelectedReferralCode] = useState<string>('');
  const [referralRedemptions, setReferralRedemptions] = useState<any[]>([]);
  const [referralRedemptionsLoading, setReferralRedemptionsLoading] = useState<boolean>(false);
  const [referralModalOpen, setReferralModalOpen] = useState<boolean>(false);
  
  // Banned users state
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [bannedUsersLoading, setBannedUsersLoading] = useState<boolean>(false);
  const [bannedUsersPage, setBannedUsersPage] = useState<number>(1);
  const [bannedUsersSearchTerm, setBannedUsersSearchTerm] = useState<string>('');
  const [banReason, setBanReason] = useState<string>('');
  const [banUserModalOpen, setBanUserModalOpen] = useState<boolean>(false);
  const [userToBan, setUserToBan] = useState<any>(null);
  const [banningUser, setBanningUser] = useState<boolean>(false);
  const [unbanningUser, setUnbanningUser] = useState<boolean>(false);
  const [banType, setBanType] = useState<'permanent' | 'temporary'>('permanent');
  const [banUntil, setBanUntil] = useState<string>('');
  
  // Onboarding analytics state
  const [onboardingAnalytics, setOnboardingAnalytics] = useState<any[]>([]);
  const [onboardingAnalyticsLoading, setOnboardingAnalyticsLoading] = useState<boolean>(false);
  const [useSandboxData, setUseSandboxData] = useState<boolean>(false);
  
  // Home dashboard stats state
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats | null>(null);
  const [supportStats, setSupportStats] = useState<SupportStats | null>(null);
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [popularReferrals, setPopularReferrals] = useState<ReferralCodeStats[]>([]);
  const [communityStats, setCommunityStats] = useState<CommunityStats[]>([]);
  const [homeStatsLoading, setHomeStatsLoading] = useState<boolean>(false);
  const [userStatsPeriod, setUserStatsPeriod] = useState<'week' | 'month' | 'sixMonths' | 'year' | 'all'>('month');
  const [referralPeriod, setReferralPeriod] = useState<'week' | 'month' | 'sixMonths' | 'year' | 'all'>('month');
  const [communityPeriod, setCommunityPeriod] = useState<'day' | 'threeDay' | 'week' | 'month'>('week');
  
  // Helper functions
  const generateUsername = (email: string) => {
    if (!email) return 'unknown';
    return email.split('@')[0];
  };
  
  const getInitials = (email: string) => {
    if (!email) return 'U';
    const username = generateUsername(email);
    return username.charAt(0).toUpperCase();
  };
  
  const getAvatarColor = (email: string) => {
    // All avatars should be blue
    return '#B3E5FC';
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  const handleReportStatusToggle = async (reportId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'resolved' ? 'pending' : 'resolved';
      
      const { error } = await updateReportStatus(reportId, newStatus);
      
      if (error) {
        console.error('Error updating report status:', error);
        alert('Failed to update report status');
        return;
      }
      
      // Update the local state
      setReports(prevReports =>
        prevReports.map(report =>
          report.id === reportId ? { ...report, status: newStatus } : report
        )
      );
      
      // Update the selectedReport state as well
      setSelectedReport((prev: any) => prev ? { ...prev, status: newStatus } : null);
      
    } catch (error) {
      console.error('Error updating report status:', error);
      alert('Failed to update report status');
    }
  };
  
  const fetchReferralCodes = async () => {
    setReferralCodesLoading(true);
    try {
      const { data, error } = await getReferralCodes();
      if (error) {
        console.error('Error fetching referral codes:', error);
      } else {
        setReferralCodes(data || []);
      }
    } catch (error) {
      console.error('Error fetching referral codes:', error);
    } finally {
      setReferralCodesLoading(false);
    }
  };

  const handleReferralCodeClick = async (referralCode: string) => {
    setSelectedReferralCode(referralCode);
    setReferralRedemptionsLoading(true);
    setReferralModalOpen(true);
    
    try {
      const { data, error } = await getReferralRedemptions(referralCode);
      if (error) {
        console.error('Error fetching referral redemptions:', error);
      } else {
        setReferralRedemptions(data || []);
      }
    } catch (error) {
      console.error('Error fetching referral redemptions:', error);
    } finally {
      setReferralRedemptionsLoading(false);
    }
  };
  
  const handleViewDetails = async (user: any) => {
    console.log('handleViewDetails called with:', user);
    
    try {
      setSelectedUser(user);
      setUserDetailsOpen(true);
      setActiveTab(0);
      
      console.log('Modal state set, fetching data for user ID:', user.id);
      
      // Fetch user posts and comments in parallel
      setPostsLoading(true);
      setCommentsLoading(true);
      
      try {
        const [postsResult, commentsResult] = await Promise.all([
          getUserPosts(user.id),
          getUserComments(user.id)
        ]);
        
        console.log('Posts result:', postsResult);
        console.log('Comments result:', commentsResult);
        
        setUserPosts(postsResult.data || []);
        setUserComments(commentsResult.data || []);
        
        console.log('Posts fetched:', postsResult.data);
        console.log('Comments fetched:', commentsResult.data);
        console.log('Posts count:', postsResult.data?.length || 0);
        console.log('Comments count:', commentsResult.data?.length || 0);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserPosts([]);
        setUserComments([]);
      } finally {
        setPostsLoading(false);
        setCommentsLoading(false);
      }
    } catch (error) {
      console.error('Error in handleViewDetails:', error);
    }
  };

  const handleUserDetailTabChange = (newTab: number) => {
    setActiveTab(newTab);
    if (newTab === 2) {
      // When switching to notification tab, fetch previous notifications
      fetchPreviousNotifications();
    }
  };

  const fetchPreviousNotifications = async () => {
    if (!selectedUser) return;
    
    console.log('🔄 fetchPreviousNotifications called for user:', selectedUser.id);
    setNotificationsLoading(true);
    try {
      const { data, error } = await getUserNotifications(selectedUser.id);
      
      if (error) {
        console.error('Error fetching previous notifications:', error);
        setPreviousNotifications([]);
      } else {
        console.log('📋 fetchPreviousNotifications received data:', data);
        console.log('📊 Data length:', data?.length || 0);
        setPreviousNotifications(data || []);
      }
    } catch (error) {
      console.error('Error in fetchPreviousNotifications:', error);
      setPreviousNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      console.log('Deleting post with ID:', postId);
      const { error } = await deletePost(postId);
      
      if (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post');
        return;
      }
      
      // Remove the post from the local state
      setUserPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      console.log('Post deleted successfully');
    } catch (error) {
      console.error('Error in handleDeletePost:', error);
      alert('Failed to delete post');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      console.log('Deleting comment with ID:', commentId);
      const { error } = await deleteComment(commentId);
      
      if (error) {
        console.error('Error deleting comment:', error);
        alert('Failed to delete comment');
        return;
      }
      
      // Remove the comment from the local state
      setUserComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
      console.log('Comment deleted successfully');
    } catch (error) {
      console.error('Error in handleDeleteComment:', error);
      alert('Failed to delete comment');
    }
  };

  const handleSendNotification = async () => {
    if (!selectedUser || !notificationTitle.trim() || !notificationMessage.trim()) {
      alert('Please fill in both title and message');
      return;
    }

    setSendingNotification(true);
    try {
      console.log('Sending notification to user:', selectedUser.id);
      const { data, error } = await sendNotification(selectedUser.id, notificationTitle.trim(), notificationMessage.trim());
      
      if (error) {
        console.error('Error sending notification:', error);
        
        // Provide specific error messages based on error type
        const errorMessage = (error as any)?.message || 'Unknown error';
        
        if (errorMessage.includes('row-level security') || errorMessage.includes('RLS')) {
          alert('Failed to send notification: Database permission error. Please ensure you are logged in as an admin and have proper permissions.');
        } else if (errorMessage.includes('policy')) {
          alert('Failed to send notification: Access policy restriction. Admin permissions required.');
        } else if (errorMessage.includes('uuid')) {
          alert('Failed to send notification: Invalid user ID format.');
        } else if (errorMessage.includes('relation "community_notifications" does not exist')) {
          alert('Failed to send notification: Database table does not exist. Please run the database migration first.');
        } else if (errorMessage.includes('Only admins can create notifications')) {
          alert('Failed to send notification: Only admin users can send notifications. Please ensure you are logged in as an admin.');
        } else if (errorMessage.includes('No authenticated user found')) {
          alert('Failed to send notification: You are not authenticated. Please log in again.');
        } else {
          alert(`Failed to send notification: ${errorMessage}`);
        }
        return;
      }
      
      console.log('Notification sent successfully', data);
      alert('Notification sent successfully!');
      
      // Refresh the notifications list
      fetchPreviousNotifications();
      
      // Reset form and stay on notification tab to see the result
      setNotificationTitle('');
      setNotificationMessage('');
    } catch (error) {
      console.error('Error in handleSendNotification:', error);
      alert('Failed to send notification: Unexpected error occurred. Please check the console for details.');
    } finally {
      setSendingNotification(false);
    }
  };

  const handleSupportRequestClick = async (supportRequest: any) => {
    console.log('Support request clicked:', supportRequest);
    setSelectedSupportRequest(supportRequest);
    setSupportRequestModalOpen(true);
    
    // Fetch user details if user_id exists
    if (supportRequest.user_id) {
      setSupportRequestUserLoading(true);
      try {
        const userResult = await getUserById(supportRequest.user_id);
        if (userResult.data) {
          setSupportRequestUser(userResult.data);
        }
      } catch (error) {
        console.error('Error fetching support request user details:', error);
      } finally {
        setSupportRequestUserLoading(false);
      }
    } else {
      setSupportRequestUser(null);
    }
  };

  const handleCloseSupportRequestModal = () => {
    setSupportRequestModalOpen(false);
    setSelectedSupportRequest(null);
    setSupportRequestUser(null);
    setSupportRequestUserLoading(false);
  };

  const handleUpdateSupportRequestStatus = async (newStatus: string) => {
    if (!selectedSupportRequest) return;

    setUpdatingStatus(true);
    try {
      console.log('Updating support request status:', selectedSupportRequest.id, newStatus);
      const { error } = await updateSupportRequestStatus(selectedSupportRequest.id, newStatus);
      
      if (error) {
        console.error('Error updating support request status:', error);
        alert('Failed to update status');
        return;
      }
      
      // Update the local state
      setSelectedSupportRequest({ ...selectedSupportRequest, status: newStatus });
      setSupportRequests(prevRequests => 
        prevRequests.map(request => 
          request.id === selectedSupportRequest.id 
            ? { ...request, status: newStatus }
            : request
        )
      );
      
      console.log('Support request status updated successfully');
      alert('Status updated successfully!');
    } catch (error) {
      console.error('Error in handleUpdateSupportRequestStatus:', error);
      alert('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteSupportRequest = async () => {
    if (!selectedSupportRequest) return;

    setDeletingSupportRequest(true);
    try {
      console.log('Deleting support request:', selectedSupportRequest.id);
      
      // First, delete the screenshot from storage if it exists
      if (selectedSupportRequest.has_screenshot && selectedSupportRequest.screenshot_path) {
        try {
          const { error: storageError } = await supabase.storage
            .from('support-imgs')
            .remove([selectedSupportRequest.screenshot_path]);
          
          if (storageError) {
            console.error('Error deleting screenshot from storage:', storageError);
            // Continue with deletion even if screenshot deletion fails
          } else {
            console.log('Screenshot deleted from storage successfully');
          }
        } catch (storageError) {
          console.error('Error deleting screenshot:', storageError);
          // Continue with deletion even if screenshot deletion fails
        }
      }
      
      // Delete the support request from the database
      const { error } = await deleteSupportRequest(selectedSupportRequest.id);
      
      if (error) {
        console.error('Error deleting support request:', error);
        alert('Failed to delete support request');
        return;
      }
      
      console.log('Support request deleted successfully');
      alert('Support request deleted successfully!');
      
      // Remove from local state
      setSupportRequests(prevRequests => 
        prevRequests.filter(request => request.id !== selectedSupportRequest.id)
      );
      
      // Close modals
      setDeleteConfirmOpen(false);
      setSupportRequestModalOpen(false);
      setSelectedSupportRequest(null);
    } catch (error) {
      console.error('Error in handleDeleteSupportRequest:', error);
      alert('Failed to delete support request');
    } finally {
      setDeletingSupportRequest(false);
    }
  };

  const handleReportClick = async (report: any) => {
    console.log('Report clicked:', report);
    setSelectedReport(report);
    setReportModalOpen(true);
    
    // Fetch reported content if it exists
    if (report.post_id || report.comment_id) {
      await fetchReportedContent(report);
    } else {
      setReportedContent(null);
    }
    
    // Fetch reporter user details
    if (report.reporter_id) {
      setReporterUserLoading(true);
      try {
        const userResult = await getUserById(report.reporter_id);
        if (userResult.data) {
          setReporterUser(userResult.data);
        }
      } catch (error) {
        console.error('Error fetching reporter user details:', error);
      } finally {
        setReporterUserLoading(false);
      }
    } else {
      setReporterUser(null);
    }
    
    // Fetch reported user details
    if (report.reported_user_id) {
      setReportedUserLoading(true);
      try {
        const userResult = await getUserById(report.reported_user_id);
        if (userResult.data) {
          setReportedUser(userResult.data);
        }
      } catch (error) {
        console.error('Error fetching reported user details:', error);
      } finally {
        setReportedUserLoading(false);
      }
    } else {
      setReportedUser(null);
    }
  };

  const handleCloseReportModal = () => {
    setReportModalOpen(false);
    setSelectedReport(null);
    setReportedContent(null);
    setReporterUser(null);
    setReporterUserLoading(false);
    setReportedUser(null);
    setReportedUserLoading(false);
  };

  const fetchReportedContent = async (report: any) => {
    setReportedContentLoading(true);
    try {
      // Check if it's a post report
      if (report.post_id) {
        const { data: postData, error: postError } = await supabase
          .from('community_posts')
          .select('*')
          .eq('id', report.post_id)
          .single();
        
        if (postData && !postError) {
          setReportedContent({ ...postData, type: 'post' });
          return;
        }
      }
      
      // Check if it's a comment report
      if (report.comment_id) {
        const { data: commentData, error: commentError } = await supabase
          .from('community_comments')
          .select('*')
          .eq('id', report.comment_id)
          .single();
        
        if (commentData && !commentError) {
          setReportedContent({ ...commentData, type: 'comment' });
          return;
        }
      }
      
      console.log('Reported content not found for report:', report.id);
      setReportedContent(null);
    } catch (error) {
      console.error('Error fetching reported content:', error);
      setReportedContent(null);
    } finally {
      setReportedContentLoading(false);
    }
  };

  const handleDeleteReportedContent = async () => {
    if (!reportedContent) return;

    try {
      console.log('Deleting reported content:', reportedContent.id, reportedContent.type);
      
      let error;
      if (reportedContent.type === 'post') {
        const result = await deletePost(reportedContent.id);
        error = result.error;
      } else if (reportedContent.type === 'comment') {
        const result = await deleteComment(reportedContent.id);
        error = result.error;
      }
      
      if (error) {
        console.error('Error deleting reported content:', error);
        alert('Failed to delete content');
        return;
      }
      
      console.log('Reported content deleted successfully');
      alert('Content deleted successfully!');
      setReportedContent(null);
    } catch (error) {
      console.error('Error in handleDeleteReportedContent:', error);
      alert('Failed to delete content');
    }
  };

  const handleDeleteReport = async () => {
    if (!selectedReport) return;

    setDeletingReport(true);
    try {
      console.log('Deleting report:', selectedReport.id);
      
      const { error } = await deleteReport(selectedReport.id);
      
      if (error) {
        console.error('Error deleting report:', error);
        alert('Failed to delete report');
        return;
      }
      
      console.log('Report deleted successfully');
      alert('Report deleted successfully!');
      
      // Remove from local state
      setReports(prevReports => 
        prevReports.filter(report => report.id !== selectedReport.id)
      );
      
      // Close modal
      setReportModalOpen(false);
      setSelectedReport(null);
      setReportedContent(null);
      setReporterUser(null);
      setReporterUserLoading(false);
      setReportedUser(null);
      setReportedUserLoading(false);
    } catch (error) {
      console.error('Error in handleDeleteReport:', error);
      alert('Failed to delete report');
    } finally {
      setDeletingReport(false);
    }
  };

  const handleBanUser = async (user: any) => {
    setUserToBan(user);
    setBanReason('');
    setBanType('permanent');
    setBanUntil('');
    setBanUserModalOpen(true);
  };

  const handleConfirmBanUser = async () => {
    if (!userToBan) return;

    setBanningUser(true);
    try {
      const bannedUntil = banType === 'temporary' && banUntil ? banUntil : undefined;
      const { error } = await banUser(userToBan.id, banReason, bannedUntil, user?.id);
      
      if (error) {
        console.error('Error banning user:', error);
        alert('Failed to ban user');
        return;
      }
      
      alert('User banned from community features successfully!');
      
      // Update local state - add to banned users
      const bannedUser = { 
        ...userToBan, 
        community_banned: true,
        ban_reason: banReason,
        banned_until: bannedUntil,
        banned_by: user?.id,
        banned_at: new Date().toISOString()
      };
      setBannedUsers(prevBanned => [bannedUser, ...prevBanned]);
      
      // Close modal
      setBanUserModalOpen(false);
      setUserToBan(null);
      setBanReason('');
      setBanType('permanent');
      setBanUntil('');
    } catch (error) {
      console.error('Error in handleConfirmBanUser:', error);
      alert('Failed to ban user');
    } finally {
      setBanningUser(false);
    }
  };

  const handleUnbanUser = async (user: any) => {
    setUnbanningUser(true);
    try {
      const { error } = await unbanUser(user.id);
      
      if (error) {
        console.error('Error unbanning user:', error);
        alert('Failed to unban user');
        return;
      }
      
      alert('User unbanned from community features successfully!');
      
      // Update local state - remove from banned users
      setBannedUsers(prevBanned => prevBanned.filter(bannedUser => bannedUser.id !== user.id));
      
    } catch (error) {
      console.error('Error in handleUnbanUser:', error);
      alert('Failed to unban user');
    } finally {
      setUnbanningUser(false);
    }
  };

  // Engagement Posts Functions
  const fetchEngagementPosts = useCallback(async () => {
    setEngagementPostsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('author_id', user.id)
        .not('display_username', 'is', null)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching engagement posts:', error);
        return;
      }

      setEngagementPosts(data || []);
    } catch (error) {
      console.error('Error in fetchEngagementPosts:', error);
    } finally {
      setEngagementPostsLoading(false);
    }
  }, []);

  const fetchScheduledPosts = useCallback(async () => {
    setScheduledPostsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('author_id', user.id)
        .not('display_username', 'is', null)
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Error fetching scheduled posts:', error);
        return;
      }

      setScheduledPosts(data || []);
    } catch (error) {
      console.error('Error in fetchScheduledPosts:', error);
    } finally {
      setScheduledPostsLoading(false);
    }
  }, []);

  const handleCreateEngagementPost = async () => {
    if (!newEngagementPost.content || !newEngagementPost.username) {
      alert('Please fill in all required fields');
      return;
    }

    setCreatingEngagementPost(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const scheduledAt = newEngagementPost.delayHours > 0 
        ? new Date(now.getTime() + (newEngagementPost.delayHours * 60 * 60 * 1000))
        : null;
      
      const status = newEngagementPost.delayHours > 0 ? 'scheduled' : 'active';

      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          author_id: user.id,
          content: newEngagementPost.content,
          display_username: newEngagementPost.username,
          display_avatar_color: newEngagementPost.avatarColor,
          like_count: newEngagementPost.likeCount,
          comment_count: 0,
          tags: null,
          scheduled_at: scheduledAt,
          status: status
        })
        .select();

      if (error) {
        console.error('Error creating engagement post:', error);
        alert('Failed to create engagement post');
        return;
      }

      // Reset form
      setNewEngagementPost({
        content: '',
        username: '',
        avatarColor: '#CBB3FF',
        likeCount: 0,
        delayHours: 0
      });

      // Refresh both active and scheduled posts
      await fetchEngagementPosts();
      await fetchScheduledPosts();
      
      const message = newEngagementPost.delayHours > 0 
        ? `Engagement post scheduled for ${newEngagementPost.delayHours} hours from now!`
        : 'Engagement post created successfully!';
      alert(message);
    } catch (error) {
      console.error('Error in handleCreateEngagementPost:', error);
      alert('Failed to create engagement post');
    } finally {
      setCreatingEngagementPost(false);
    }
  };

  const handleDeleteEngagementPost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this engagement post?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error('Error deleting engagement post:', error);
        alert('Failed to delete engagement post');
        return;
      }

      // Refresh engagement posts
      await fetchEngagementPosts();
      alert('Engagement post deleted successfully!');
    } catch (error) {
      console.error('Error in handleDeleteEngagementPost:', error);
      alert('Failed to delete engagement post');
    }
  };

  const handleUpdateLikeCount = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('community_posts')
        .update({ like_count: newLikeCount })
        .eq('id', postId);

      if (error) {
        console.error('Error updating like count:', error);
        alert('Failed to update like count');
        return;
      }

      // Refresh engagement posts
      await fetchEngagementPosts();
      setEditingLikeCount(null);
      setNewLikeCount(0);
      alert('Like count updated successfully!');
    } catch (error) {
      console.error('Error in handleUpdateLikeCount:', error);
      alert('Failed to update like count');
    }
  };

  const handleStartEditLikeCount = (postId: string, currentLikeCount: number) => {
    setEditingLikeCount(postId);
    setNewLikeCount(currentLikeCount);
  };

  const handleCancelEditLikeCount = () => {
    setEditingLikeCount(null);
    setNewLikeCount(0);
  };

  // Timer and scheduling functions
  const formatTimeRemaining = (scheduledAt: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const diff = scheduled.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ready to post';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const checkAndActivateScheduledPosts = useCallback(async () => {
    try {
      const now = new Date();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to use the edge function first (if available)
      try {
        const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/activate-scheduled-posts`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Edge function activated posts:', result);
          // Refresh lists after edge function runs
          await fetchEngagementPosts();
          await fetchScheduledPosts();
          return;
        }
      } catch (edgeFunctionError) {
        console.log('Edge function not available, falling back to client-side check');
      }

      // Fallback to client-side check
      const { data: overduePosts, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('author_id', user.id)
        .eq('status', 'scheduled')
        .lte('scheduled_at', now.toISOString());

      if (error) {
        console.error('Error checking scheduled posts:', error);
        return;
      }

      if (overduePosts && overduePosts.length > 0) {
        // Activate overdue posts
        const { error: updateError } = await supabase
          .from('community_posts')
          .update({ status: 'active' })
          .in('id', overduePosts.map(post => post.id));

        if (!updateError) {
          // Refresh both lists
          await fetchEngagementPosts();
          await fetchScheduledPosts();
        }
      }
    } catch (error) {
      console.error('Error in checkAndActivateScheduledPosts:', error);
    }
  }, [fetchEngagementPosts, fetchScheduledPosts]);

  const handleDeleteScheduledPost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this scheduled post?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error('Error deleting scheduled post:', error);
        alert('Failed to delete scheduled post');
        return;
      }

      // Refresh scheduled posts
      await fetchScheduledPosts();
      alert('Scheduled post deleted successfully!');
    } catch (error) {
      console.error('Error in handleDeleteScheduledPost:', error);
      alert('Failed to delete scheduled post');
    }
  };

  // Engagement Comments Functions
  const fetchPostComments = async (postId: string) => {
    setPostCommentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching post comments:', error);
        return;
      }

      setPostComments(data || []);
    } catch (error) {
      console.error('Error in fetchPostComments:', error);
    } finally {
      setPostCommentsLoading(false);
    }
  };

  const handleOpenCommentsModal = async (post: any) => {
    setSelectedPostForComments(post);
    setCommentsModalOpen(true);
    await fetchPostComments(post.id);
  };

  const handleCloseCommentsModal = () => {
    setCommentsModalOpen(false);
    setSelectedPostForComments(null);
    setPostComments([]);
    setNewEngagementComment({
      content: '',
      username: '',
      avatarColor: '#CBB3FF',
      likeCount: 0
    });
  };

  const handleCreateEngagementComment = async () => {
    if (!newEngagementComment.content || !newEngagementComment.username || !selectedPostForComments) {
      alert('Please fill in all required fields');
      return;
    }

    setCreatingEngagementComment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('community_comments')
        .insert({
          post_id: selectedPostForComments.id,
          author_id: user.id,
          content: newEngagementComment.content,
          display_username: newEngagementComment.username,
          display_avatar_color: newEngagementComment.avatarColor,
          like_count: newEngagementComment.likeCount
        })
        .select();

      if (error) {
        console.error('Error creating engagement comment:', error);
        alert('Failed to create engagement comment');
        return;
      }

      // Reset form
      setNewEngagementComment({
        content: '',
        username: '',
        avatarColor: '#CBB3FF',
        likeCount: 0
      });

      // Refresh comments
      await fetchPostComments(selectedPostForComments.id);
      
      alert('Engagement comment created successfully!');
    } catch (error) {
      console.error('Error in handleCreateEngagementComment:', error);
      alert('Failed to create engagement comment');
    } finally {
      setCreatingEngagementComment(false);
    }
  };

  const handleDeleteEngagementComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this engagement comment?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('community_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting engagement comment:', error);
        alert('Failed to delete engagement comment');
        return;
      }

      // Refresh comments
      if (selectedPostForComments) {
        await fetchPostComments(selectedPostForComments.id);
      }
      alert('Engagement comment deleted successfully!');
    } catch (error) {
      console.error('Error in handleDeleteEngagementComment:', error);
      alert('Failed to delete engagement comment');
    }
  };

  // Engagement Comments Tab Functions
  const fetchAllPosts = useCallback(async () => {
    setAllPostsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('community_posts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (postFilter === 'engagement') {
        query = query
          .eq('author_id', user.id)
          .not('display_username', 'is', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all posts:', error);
        return;
      }

      setAllPosts(data || []);
    } catch (error) {
      console.error('Error in fetchAllPosts:', error);
    } finally {
      setAllPostsLoading(false);
    }
  }, [postFilter]);

  const handleOpenCommentModal = async (post: any) => {
    setSelectedPostForCommenting(post);
    setCommentModalOpen(true);
    await fetchPostComments(post.id);
  };

  const handleCloseCommentModal = () => {
    setCommentModalOpen(false);
    setSelectedPostForCommenting(null);
    setPostComments([]);
    setNewComment({
      content: '',
      username: '',
      avatarColor: '#CBB3FF',
      likeCount: 0
    });
  };

  const handleCreateComment = async () => {
    if (!newComment.content || !newComment.username || !selectedPostForCommenting) {
      alert('Please fill in all required fields');
      return;
    }

    setCreatingComment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('community_comments')
        .insert({
          post_id: selectedPostForCommenting.id,
          author_id: user.id,
          content: newComment.content,
          display_username: newComment.username,
          display_avatar_color: newComment.avatarColor,
          like_count: newComment.likeCount
        })
        .select();

      if (error) {
        console.error('Error creating comment:', error);
        alert('Failed to create comment');
        return;
      }

      // Reset form
      setNewComment({
        content: '',
        username: '',
        avatarColor: '#CBB3FF',
        likeCount: 0
      });

      // Refresh comments
      await fetchPostComments(selectedPostForCommenting.id);
      
      alert('Comment created successfully!');
    } catch (error) {
      console.error('Error in handleCreateComment:', error);
      alert('Failed to create comment');
    } finally {
      setCreatingComment(false);
    }
  };

  const [dbConnectionStatus, setDbConnectionStatus] = useState<{
    checking: boolean;
    connected: boolean;
    error: string | null;
  }>({
    checking: true,
    connected: false,
    error: null
  });
  
  // Data fetching functions
  const fetchAllData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [usersData, playersData, supportData, reportsData, bannedUsersData] = await Promise.all([
        getUsers(),
        getPlayers(),
        getSupportRequests(),
        getReports(),
        getBannedUsers()
      ]);
      
      console.log('Support data result:', { data: supportData.data, error: supportData.error, count: supportData.data?.length });
      
      if (supportData.error) {
        console.error('Error fetching support requests in fetchAllData:', supportData.error);
      }
      
      if (reportsData.error) {
        console.error('Error fetching reports in fetchAllData:', reportsData.error);
      }
      
      setUsers(usersData.data || []);
      setPlayers(playersData.data || []);
      setSupportRequests(supportData.data || []);
      setReports(reportsData.data || []);
      setBannedUsers(bannedUsersData.data || []);
      
      // Also fetch referral codes for the referral tab
      await fetchReferralCodes();
      
      // Fetch onboarding analytics
      await fetchOnboardingAnalytics();
      
      // Fetch home dashboard stats
      await fetchHomeStats();
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setDataLoading(false);
    }
  }, []);
  
  // Onboarding Analytics functions
  const fetchOnboardingAnalytics = useCallback(async () => {
    setOnboardingAnalyticsLoading(true);
    try {
      const { data, error } = await getOnboardingAnalytics();
      if (error) {
        console.error('Error fetching onboarding analytics:', error);
      } else {
        setOnboardingAnalytics(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch onboarding analytics:', error);
    } finally {
      setOnboardingAnalyticsLoading(false);
    }
  }, []);
  
  // Home Dashboard Stats functions
  const fetchHomeStats = useCallback(async () => {
    setHomeStatsLoading(true);
    try {
      const [userStatsResult, subscriptionStatsResult, supportStatsResult, reportStatsResult, referralsResult, communityResult] = await Promise.all([
        getUserStats(),
        getSubscriptionStats(),
        getSupportStats(),
        getReportStats(),
        getPopularReferralCodes(referralPeriod),
        getCommunityStats(communityPeriod)
      ]);
      
      if (userStatsResult.data) setUserStats(userStatsResult.data);
      if (subscriptionStatsResult.data) setSubscriptionStats(subscriptionStatsResult.data);
      if (supportStatsResult.data) setSupportStats(supportStatsResult.data);
      if (reportStatsResult.data) setReportStats(reportStatsResult.data);
      if (referralsResult.data) setPopularReferrals(referralsResult.data);
      if (communityResult.data) setCommunityStats(communityResult.data);
    } catch (error) {
      console.error('Failed to fetch home stats:', error);
    } finally {
      setHomeStatsLoading(false);
    }
  }, [referralPeriod, communityPeriod]);
  
  // Fetch referrals when period changes
  const fetchPopularReferrals = useCallback(async () => {
    const { data } = await getPopularReferralCodes(referralPeriod);
    if (data) setPopularReferrals(data);
  }, [referralPeriod]);
  
  // Fetch community stats when period changes
  const fetchCommunityStatsData = useCallback(async () => {
    const { data } = await getCommunityStats(communityPeriod);
    if (data) setCommunityStats(data);
  }, [communityPeriod]);
  
  // iOS Update System functions
  const fetchIosUpdateSettings = useCallback(async () => {
    setIosUpdateLoading(true);
    try {
      console.log('Fetching iOS update settings...');
      
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'force_update_enabled')
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - use default settings
          console.log('No settings found, using defaults');
          setIosUpdateSettings({
            force_update_enabled: false,
            custom_message: 'A new version of Momu is available. Please update to continue using the app.',
            current_version: '1.0.6',
            latest_version: '1.0.6'
          });
        } else {
          console.error('Supabase error:', error);
          throw error;
        }
      } else if (data) {
        console.log('Settings found:', data);
        const settings = data.setting_value || {};
        setIosUpdateSettings((prev: any) => ({
          ...prev,
          force_update_enabled: settings.enabled || false,
          custom_message: settings.message || 'A new version of Momu is available. Please update to continue using the app.',
          current_version: settings.current_version || '1.0.6'
        }));
      }
      
      // Fetch latest version from App Store
      await fetchLatestAppStoreVersion();
    } catch (error) {
      console.error('Failed to fetch iOS update settings:', error);
      // Set default settings on error
      setIosUpdateSettings({
        force_update_enabled: false,
        custom_message: 'A new version of Momu is available. Please update to continue using the app.',
        current_version: '1.0.6',
        latest_version: '1.0.6'
      });
    } finally {
      setIosUpdateLoading(false);
    }
  }, []);
  
  const fetchLatestAppStoreVersion = async () => {
    try {
      const response = await fetch('https://itunes.apple.com/lookup?id=6747963200');
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const latestVersion = data.results[0].version;
        setIosUpdateSettings((prev: any) => ({
          ...prev,
          latest_version: latestVersion
        }));
      }
    } catch (error) {
      console.error('Failed to fetch latest App Store version:', error);
    }
  };
  
  const saveIosUpdateSettings = async (updatedSettings?: any) => {
    setIosUpdateSaving(true);
    try {
      // Use passed settings or current state
      const settingsToSave = updatedSettings || iosUpdateSettings;
      
      const settingsData = {
        enabled: settingsToSave.force_update_enabled,
        message: settingsToSave.custom_message,
        current_version: settingsToSave.current_version,
        latest_version: settingsToSave.latest_version,
        updated_at: new Date().toISOString()
      };
      
      console.log('Saving iOS update settings:', settingsData);
      
      const { data, error } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'force_update_enabled',
          setting_value: settingsData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('iOS update settings saved successfully:', data);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4caf50; color: white; padding: 16px 24px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
      successMessage.textContent = '✓ Settings saved successfully';
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 3000);
      
    } catch (error: any) {
      console.error('Failed to save iOS update settings:', error);
      // Show detailed error to user
      const errorMessage = error?.message || error?.error_description || JSON.stringify(error) || 'Unknown error occurred';
      alert(`Failed to save settings: ${errorMessage}\n\nCheck console for details.`);
    } finally {
      setIosUpdateSaving(false);
    }
  };
  
  const handleForceUpdateToggle = async () => {
    const newSettings = {
      ...iosUpdateSettings,
      force_update_enabled: !iosUpdateSettings.force_update_enabled
    };
    setIosUpdateSettings(newSettings);
    // Pass the new settings directly to avoid stale state
    await saveIosUpdateSettings(newSettings);
  };
  
  const handleCustomMessageChange = (message: string) => {
    setIosUpdateSettings((prev: any) => ({
      ...prev,
      custom_message: message
    }));
  };
  
  const handleCurrentVersionChange = (version: string) => {
    setIosUpdateSettings((prev: any) => ({
      ...prev,
      current_version: version
    }));
  };
  
  // Check Supabase connection
  React.useEffect(() => {
    const checkConnection = async () => {
      try {
        // Try a simple query to check connection
        const healthCheck = await supabase.from('user_profiles').select('count').limit(1);
        
        if (healthCheck.error) {
          throw healthCheck.error;
        }
        
        setDbConnectionStatus({
          checking: false,
          connected: true,
          error: null
        });
        
        // Fetch data when connection is successful
        await fetchAllData();
        
        // Fetch engagement posts and scheduled posts
        await fetchEngagementPosts();
        await fetchScheduledPosts();
        
        // Fetch iOS update settings
        await fetchIosUpdateSettings();
        
        console.log("Supabase connection successful");
      } catch (err: any) {
        console.error('Supabase connection error:', err);
        setDbConnectionStatus({
          checking: false,
          connected: false,
          error: err.message || 'Failed to connect to Supabase database'
        });
      }
    };
    
    checkConnection();
  }, [fetchAllData, fetchEngagementPosts, fetchScheduledPosts, fetchIosUpdateSettings]);

  // Timer to check scheduled posts every minute
  useEffect(() => {
    const timer = setInterval(() => {
      checkAndActivateScheduledPosts();
    }, 60000); // Check every minute

    return () => clearInterval(timer);
  }, [checkAndActivateScheduledPosts]);

  // Also check when the page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAndActivateScheduledPosts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkAndActivateScheduledPosts]);

  // Fetch all posts when engagement comments tab is accessed or filter changes
  useEffect(() => {
    if (currentTab === 8) { // Engagement Comments tab
      fetchAllPosts();
    }
  }, [currentTab, postFilter, fetchAllPosts]);

  // Real-time countdown timer (updates every second when viewing scheduled posts)
  useEffect(() => {
    if (showScheduledPosts && scheduledPosts.length > 0) {
      const countdownTimer = setInterval(() => {
        // Force re-render to update countdown display
        setScheduledPosts(prev => [...prev]);
      }, 1000); // Update every second

      return () => clearInterval(countdownTimer);
    }
  }, [showScheduledPosts, scheduledPosts.length]);
  
  // Refetch referrals when period changes
  useEffect(() => {
    if (currentTab === 0) {
      fetchPopularReferrals();
    }
  }, [referralPeriod, currentTab, fetchPopularReferrals]);
  
  // Refetch community stats when period changes
  useEffect(() => {
    if (currentTab === 0) {
      fetchCommunityStatsData();
    }
  }, [communityPeriod, currentTab, fetchCommunityStatsData]);
  
  // If user is not authenticated and not loading, redirect to login
  if (!loading && !user) {
    return <Navigate to="/" replace />;
  }
  
  const renderTabContent = () => {
    if (dbConnectionStatus.checking) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress color="primary" />
        </Box>
      );
    }
    
    if (!dbConnectionStatus.connected) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          <Typography variant="h6">Database Connection Error</Typography>
          <Typography variant="body1">{dbConnectionStatus.error}</Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Please check your Supabase configuration and ensure your .env file is properly set up.
          </Typography>
        </Alert>
      );
    }
    
    if (dataLoading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress color="primary" />
          <Typography variant="body1" sx={{ ml: 2 }}>Loading data...</Typography>
        </Box>
      );
    }


        const renderUsers = () => {
      const filteredUsers = users.filter(user => 
        (user.username || user.email || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        (user.referral_code || '').toLowerCase().includes(userSearchTerm.toLowerCase())
      );

      // Pagination logic
      const totalUsers = filteredUsers.length;
      const totalPages = Math.ceil(totalUsers / usersPerPage);
      const startIndex = (usersPage - 1) * usersPerPage;
      const endIndex = startIndex + usersPerPage;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    return (
        <Box>
          <Box sx={{ mb: 3, p: 2, backgroundColor: '#1a1a1a', borderRadius: 2 }}>
            <Alert severity="info" sx={{ mb: 2, backgroundColor: '#2a2a2a', color: '#ffffff' }}>
              Tried users table: Found {totalUsers} records
            </Alert>
            <TextField
              placeholder="Search by name, username, or referral code..."
              value={userSearchTerm}
              onChange={(e) => {
                setUserSearchTerm(e.target.value);
                setUsersPage(1); // Reset to first page when searching
              }}
              fullWidth
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#2a2a2a',
                  color: '#ffffff',
                  '& fieldset': {
                    borderColor: '#333333',
                  },
                  '&:hover fieldset': {
                    borderColor: '#555555',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#f5f5f5',
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#cccccc',
                },
              }}
            />
          </Box>
          
          {totalUsers === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: '#cccccc' }}>
              No users to show
            </Box>
          ) : (
            <>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: 3,
                mb: 3
              }}>
                {paginatedUsers.map((user) => (
                  <Card key={user.id} sx={{ 
                    backgroundColor: '#2a2a2a', 
                    color: '#ffffff',
                    '&:hover': { backgroundColor: '#333333' },
                    transition: 'background-color 0.3s'
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: getAvatarColor(user.username || user.email), 
                            width: 56, 
                            height: 56, 
                            mr: 2,
                            fontSize: '1.5rem'
                          }}
                        >
                          {getInitials(user.username || user.email)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                            @{user.username || generateUsername(user.email)}
                          </Typography>
                          {user.referral_code && (
                            <Typography variant="body2" sx={{ color: '#999999', fontSize: '0.8rem' }}>
                              Ref: {user.referral_code}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CalendarIcon sx={{ color: '#CBB3FF', mr: 1, fontSize: '1.2rem' }} />
                        <Typography variant="body2" sx={{ color: '#ffffff' }}>
                          Joined: {new Date(user.created_at).toLocaleDateString('en-GB')}
          </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Chip 
                            label={user.status === 'active' ? 'Active' : 'Inactive'} 
                            color={user.status === 'active' ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('User button clicked:', user);
                            handleViewDetails(user);
                          }}
                          sx={{
                            backgroundColor: '#CBB3FF',
                            color: '#333333',
                            '&:hover': {
                              backgroundColor: '#A9E5BB',
                            },
                          }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={usersPage}
                    onChange={(_, newPage) => setUsersPage(newPage)}
                    sx={{
                      '& .MuiPaginationItem-root': {
                        color: '#ffffff',
                      },
                      '& .Mui-selected': {
                        backgroundColor: '#CBB3FF',
                        color: '#ffffff',
                      },
                      '& .MuiPaginationItem-root:hover': {
                        backgroundColor: 'rgba(203, 179, 255, 0.1)',
                      },
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      );
    };

    const renderPlayers = () => {
      const filteredPlayers = players.filter(player => 
        (player.username || player.email || '').toLowerCase().includes(playerSearchTerm.toLowerCase()) ||
        player.name?.toLowerCase().includes(playerSearchTerm.toLowerCase()) ||
        player.role?.toLowerCase().includes(playerSearchTerm.toLowerCase()) ||
        (player.referral_code || '').toLowerCase().includes(playerSearchTerm.toLowerCase())
      );

      // Pagination logic
      const totalPlayers = filteredPlayers.length;
      const totalPages = Math.ceil(totalPlayers / usersPerPage);
      const startIndex = (playersPage - 1) * usersPerPage;
      const endIndex = startIndex + usersPerPage;
      const paginatedPlayers = filteredPlayers.slice(startIndex, endIndex);

      return (
        <Box>
          <Box sx={{ mb: 3, p: 2, backgroundColor: '#1a1a1a', borderRadius: 2 }}>
            <Alert severity="info" sx={{ mb: 2, backgroundColor: '#2a2a2a', color: '#ffffff' }}>
              Tried players table: Found {totalPlayers} records
            </Alert>
            <TextField
              placeholder="Search by name, username, role, or referral code..."
              value={playerSearchTerm}
              onChange={(e) => {
                setPlayerSearchTerm(e.target.value);
                setPlayersPage(1); // Reset to first page when searching
              }}
              fullWidth
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#2a2a2a',
                  color: '#ffffff',
                  '& fieldset': {
                    borderColor: '#333333',
                  },
                  '&:hover fieldset': {
                    borderColor: '#555555',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#f5f5f5',
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#cccccc',
                },
              }}
            />
          </Box>
          
          {totalPlayers === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: '#cccccc' }}>
              No players to show
            </Box>
          ) : (
            <>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: 3,
                mb: 3
              }}>
                {paginatedPlayers.map((player) => (
                  <Card key={player.id} sx={{ 
                    backgroundColor: '#2a2a2a', 
                    color: '#ffffff',
                    '&:hover': { backgroundColor: '#333333' },
                    transition: 'background-color 0.3s'
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: getAvatarColor(player.username || player.email), 
                            width: 56, 
                            height: 56, 
                            mr: 2,
                            fontSize: '1.5rem'
                          }}
                        >
                          {getInitials(player.username || player.email)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                            @{player.username || generateUsername(player.email)}
                          </Typography>
                          {player.referral_code && (
                            <Typography variant="body2" sx={{ color: '#999999', fontSize: '0.8rem' }}>
                              Ref: {player.referral_code}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CalendarIcon sx={{ color: '#FFB385', mr: 1, fontSize: '1.2rem' }} />
                        <Typography variant="body2" sx={{ color: '#ffffff' }}>
                          Joined: {new Date(player.created_at).toLocaleDateString('en-GB')}
          </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Chip 
                            label={player.role === 'admin' ? 'Admin' : 'Invited'} 
                            sx={{
                              backgroundColor: player.role === 'admin' ? '#FFB385' : '#B3E5FC',
                              color: '#333333',
                              fontWeight: 'bold'
                            }}
                            size="small"
                          />
                        </Box>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Player button clicked:', player);
                            handleViewDetails(player);
                          }}
                          sx={{
                            backgroundColor: '#CBB3FF',
                            color: '#333333',
                            '&:hover': {
                              backgroundColor: '#A9E5BB',
                            },
                          }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={playersPage}
                    onChange={(_, newPage) => setPlayersPage(newPage)}
                    sx={{
                      '& .MuiPaginationItem-root': {
                        color: '#ffffff',
                      },
                      '& .Mui-selected': {
                        backgroundColor: '#FFB385',
                        color: '#ffffff',
                      },
                      '& .MuiPaginationItem-root:hover': {
                        backgroundColor: 'rgba(255, 179, 133, 0.1)',
                      },
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      );
    };



    const renderSupportRequests = () => (
        <TableContainer component={Paper} sx={{ backgroundColor: '#1a1a1a', borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', borderBottom: '1px solid #333333' }}>ID</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', borderBottom: '1px solid #333333' }}>Subject</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', borderBottom: '1px solid #333333' }}>User</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', borderBottom: '1px solid #333333' }}>Screenshot</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', borderBottom: '1px solid #333333' }}>Status</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', borderBottom: '1px solid #333333' }}>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {supportRequests.map((request) => (
              <TableRow 
                key={request.id} 
                sx={{ 
                  '&:hover': { backgroundColor: '#2a2a2a' },
                  cursor: 'pointer'
                }}
                onClick={() => handleSupportRequestClick(request)}
              >
                <TableCell sx={{ color: '#ffffff', borderBottom: '1px solid #333333', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {request.id?.substring(0, 8)}...
                </TableCell>
                <TableCell sx={{ color: '#ffffff', borderBottom: '1px solid #333333' }}>{request.subject}</TableCell>
                <TableCell sx={{ color: '#ffffff', borderBottom: '1px solid #333333' }}>{request.email || request.name || 'N/A'}</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #333333', textAlign: 'center' }}>
                  {request.has_screenshot && request.screenshot_path ? (
                    <Chip 
                      label="📷" 
                      size="small"
                      sx={{
                        backgroundColor: '#4caf50',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '0.8rem'
                      }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ color: '#666666' }}>-</Typography>
                  )}
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #333333' }}>
                  <Chip 
                    label={request.status} 
                    color={
                      request.status === 'resolved' || request.status === 'closed' ? 'success' : 
                      request.status === 'in_progress' ? 'warning' : 
                      request.status === 'open' ? 'success' : 'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ color: '#ffffff', borderBottom: '1px solid #333333' }}>{new Date(request.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );

    const renderReports = () => (
      <TableContainer component={Paper} sx={{ backgroundColor: '#1a1a1a', borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', borderBottom: '1px solid #333333' }}>Reason</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', borderBottom: '1px solid #333333' }}>Reporter</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', borderBottom: '1px solid #333333' }}>Content Type</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', borderBottom: '1px solid #333333' }}>Time Since</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', borderBottom: '1px solid #333333' }}>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((report) => (
              <TableRow 
                key={report.id} 
                sx={{ 
                  '&:hover': { backgroundColor: '#2a2a2a' },
                  cursor: 'pointer'
                }}
                onClick={() => handleReportClick(report)}
              >
                <TableCell sx={{ color: '#ffffff', borderBottom: '1px solid #333333' }}>{report.reason}</TableCell>
                <TableCell sx={{ color: '#ffffff', borderBottom: '1px solid #333333' }}>
                  @{report.reporter?.name || report.reporter?.username || 'N/A'}
                </TableCell>
                <TableCell sx={{ color: '#ffffff', borderBottom: '1px solid #333333' }}>
                  {report.post_id ? 'Post' : report.comment_id ? 'Comment' : 'N/A'}
                </TableCell>
                <TableCell sx={{ color: '#ffffff', borderBottom: '1px solid #333333' }}>
                  {getTimeSince(report.created_at)}
                </TableCell>
                <TableCell sx={{ color: '#ffffff', borderBottom: '1px solid #333333' }}>{new Date(report.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );

    const renderReferral = () => (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Paper sx={{ backgroundColor: '#2a2a2a', p: 4, borderRadius: 2 }}>
          <Typography variant="h5" sx={{ color: '#ffffff', mb: 3, textAlign: 'center' }}>
            Referral Codes
          </Typography>
          
          {referralCodesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={30} sx={{ color: '#A9E5BB' }} />
            </Box>
          ) : referralCodes.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: '#cccccc' }}>
              No referral codes found
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
              {referralCodes.map((referralCode) => (
                <Card
                  key={referralCode.id}
                  sx={{
                    backgroundColor: '#1a1a1a',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    },
                  }}
                  onClick={() => handleReferralCodeClick(referralCode.code)}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>
                      {referralCode.code}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#cccccc' }}>
                          Last 7 days:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#A9E5BB', fontWeight: 'bold' }}>
                          {referralCode.last_7_days}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#cccccc' }}>
                          Last 30 days:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#A9E5BB', fontWeight: 'bold' }}>
                          {referralCode.last_30_days}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#cccccc' }}>
                          Last 60 days:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#A9E5BB', fontWeight: 'bold' }}>
                          {referralCode.last_60_days}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#cccccc' }}>
                          All time:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#A9E5BB', fontWeight: 'bold' }}>
                          {referralCode.total_redemptions}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" sx={{ color: '#cccccc', fontSize: '0.8rem' }}>
                      Created: {new Date(referralCode.created_at).toLocaleDateString('en-GB')}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Paper>
      </Box>
    );

    const renderBannedUsers = () => {
      const filteredBannedUsers = bannedUsers.filter(user => 
        (user.username || user.email || '').toLowerCase().includes(bannedUsersSearchTerm.toLowerCase()) ||
        user.name?.toLowerCase().includes(bannedUsersSearchTerm.toLowerCase()) ||
        (user.referral_code || '').toLowerCase().includes(bannedUsersSearchTerm.toLowerCase())
      );

      // Pagination logic
      const totalBannedUsers = filteredBannedUsers.length;
      const totalPages = Math.ceil(totalBannedUsers / usersPerPage);
      const startIndex = (bannedUsersPage - 1) * usersPerPage;
      const endIndex = startIndex + usersPerPage;
      const paginatedBannedUsers = filteredBannedUsers.slice(startIndex, endIndex);

      return (
        <Box>
          <Box sx={{ mb: 3, p: 2, backgroundColor: '#1a1a1a', borderRadius: 2 }}>
            <Alert severity="warning" sx={{ mb: 2, backgroundColor: '#2a2a2a', color: '#ffffff' }}>
              Banned Users: Found {totalBannedUsers} records
            </Alert>
            <TextField
              placeholder="Search banned users by name, username, or referral code..."
              value={bannedUsersSearchTerm}
              onChange={(e) => {
                setBannedUsersSearchTerm(e.target.value);
                setBannedUsersPage(1); // Reset to first page when searching
              }}
              fullWidth
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#2a2a2a',
                  color: '#ffffff',
                  '& fieldset': {
                    borderColor: '#333333',
                  },
                  '&:hover fieldset': {
                    borderColor: '#555555',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#f5f5f5',
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#cccccc',
                },
              }}
            />
          </Box>
          
          {totalBannedUsers === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: '#cccccc' }}>
              No banned users found
            </Box>
          ) : (
            <>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: 3,
                mb: 3
              }}>
                {paginatedBannedUsers.map((user) => (
                  <Card key={user.id} sx={{ 
                    backgroundColor: '#2a2a2a', 
                    color: '#ffffff',
                    '&:hover': { backgroundColor: '#333333' },
                    transition: 'background-color 0.3s'
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: '#ff6b6b', 
                            width: 56, 
                            height: 56, 
                            mr: 2,
                            fontSize: '1.5rem'
                          }}
                        >
                          {getInitials(user.username || user.email)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                            @{user.username || generateUsername(user.email)}
                          </Typography>
                          {user.referral_code && (
                            <Typography variant="body2" sx={{ color: '#999999', fontSize: '0.8rem' }}>
                              Ref: {user.referral_code}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CalendarIcon sx={{ color: '#CBB3FF', mr: 1, fontSize: '1.2rem' }} />
                        <Typography variant="body2" sx={{ color: '#ffffff' }}>
                          Joined: {new Date(user.created_at).toLocaleDateString('en-GB')}
                        </Typography>
                      </Box>
                      
                                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Chip 
                              label={user.banned_until ? 'Temporarily Banned' : 'Permanently Banned'} 
                              color="error"
                              size="small"
                            />
                            {user.ban_reason && (
                              <Typography variant="caption" sx={{ color: '#cccccc', fontSize: '0.7rem' }}>
                                Reason: {user.ban_reason}
                              </Typography>
                            )}
                            {user.banned_until && (
                              <Typography variant="caption" sx={{ color: '#cccccc', fontSize: '0.7rem' }}>
                                Until: {new Date(user.banned_until).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnbanUser(user);
                            }}
                            disabled={unbanningUser}
                            sx={{
                              backgroundColor: '#4caf50',
                              color: '#ffffff',
                              '&:hover': {
                                backgroundColor: '#45a049',
                              },
                              '&:disabled': {
                                backgroundColor: '#666666',
                              },
                            }}
                          >
                            {unbanningUser ? 'Unbanning...' : 'Unban User'}
                          </Button>
                        </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={bannedUsersPage}
                    onChange={(_, newPage) => setBannedUsersPage(newPage)}
                    sx={{
                      '& .MuiPaginationItem-root': {
                        color: '#ffffff',
                      },
                      '& .Mui-selected': {
                        backgroundColor: '#CBB3FF',
                        color: '#ffffff',
                      },
                      '& .MuiPaginationItem-root:hover': {
                        backgroundColor: 'rgba(203, 179, 255, 0.1)',
                      },
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      );
    };

    const renderEngagementPosts = () => {
      return (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
              Engagement Posts Management
            </Typography>
            <Button
              variant={showScheduledPosts ? "contained" : "outlined"}
              onClick={() => {
                setShowScheduledPosts(!showScheduledPosts);
                if (!showScheduledPosts) {
                  fetchScheduledPosts();
                }
              }}
              sx={{
                color: showScheduledPosts ? '#000000' : '#CBB3FF',
                backgroundColor: showScheduledPosts ? '#CBB3FF' : 'transparent',
                borderColor: '#CBB3FF',
                '&:hover': {
                  borderColor: '#A9E5BB',
                  backgroundColor: showScheduledPosts ? '#A9E5BB' : 'rgba(203, 179, 255, 0.1)',
                },
              }}
            >
              {showScheduledPosts ? 'Hide' : 'Show'} Scheduled Posts ({scheduledPosts.length})
            </Button>
          </Box>
          
          {/* Create New Engagement Post Form */}
          <Paper sx={{ backgroundColor: '#1a1a1a', p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
              Create New Engagement Post
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Username"
                value={newEngagementPost.username}
                onChange={(e) => setNewEngagementPost(prev => ({ ...prev, username: e.target.value }))}
                placeholder="e.g., CommunityBot"
                sx={{
                  '& .MuiInputBase-root': {
                    color: '#ffffff',
                    backgroundColor: '#2a2a2a',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#cccccc',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#444444',
                  },
                }}
              />
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Post Content"
                value={newEngagementPost.content}
                onChange={(e) => setNewEngagementPost(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your engagement post content here..."
                sx={{
                  '& .MuiInputBase-root': {
                    color: '#ffffff',
                    backgroundColor: '#2a2a2a',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#cccccc',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#444444',
                  },
                }}
              />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl sx={{ width: '200px' }}>
                  <Typography variant="body2" sx={{ color: '#cccccc', mb: 1 }}>
                    Avatar Color
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {['#A9E5BB', '#FFB385', '#CBB3FF', '#B3E5FC'].map((color) => (
                      <Box
                        key={color}
                        onClick={() => setNewEngagementPost(prev => ({ ...prev, avatarColor: color }))}
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: color,
                          borderRadius: '50%',
                          cursor: 'pointer',
                          border: newEngagementPost.avatarColor === color ? '3px solid #ffffff' : '2px solid #444444',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            borderColor: '#ffffff',
                          },
                        }}
                      />
                    ))}
                  </Box>
                </FormControl>
                
                <TextField
                  label="Initial Like Count"
                  type="number"
                  value={newEngagementPost.likeCount}
                  onChange={(e) => setNewEngagementPost(prev => ({ ...prev, likeCount: parseInt(e.target.value) || 0 }))}
                  inputProps={{ min: 0 }}
                  sx={{
                    width: '200px',
                    '& .MuiInputBase-root': {
                      color: '#ffffff',
                      backgroundColor: '#2a2a2a',
                    },
                    '& .MuiInputLabel-root': {
                      color: '#cccccc',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#444444',
                    },
                  }}
                />
              </Box>
              
              <TextField
                fullWidth
                label="Delay Hours (0 = post immediately)"
                type="number"
                value={newEngagementPost.delayHours}
                onChange={(e) => setNewEngagementPost(prev => ({ ...prev, delayHours: parseInt(e.target.value) || 0 }))}
                inputProps={{ min: 0, max: 999 }}
                helperText="Set to 0 for immediate posting, or any number of hours to delay"
                sx={{
                  '& .MuiInputBase-root': {
                    color: '#ffffff',
                    backgroundColor: '#2a2a2a',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#cccccc',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#444444',
                  },
                  '& .MuiFormHelperText-root': {
                    color: '#999999',
                  },
                }}
              />
              
              <Button
                variant="contained"
                onClick={handleCreateEngagementPost}
                disabled={creatingEngagementPost || !newEngagementPost.content || !newEngagementPost.username}
                sx={{
                  backgroundColor: '#CBB3FF',
                  color: '#000000',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: '#A9E5BB',
                  },
                  '&:disabled': {
                    backgroundColor: '#666666',
                    color: '#999999',
                  },
                }}
              >
                {creatingEngagementPost ? 'Creating...' : 'Create Engagement Post'}
              </Button>
            </Box>
          </Paper>
          
          {/* Scheduled Posts Section */}
          {showScheduledPosts && (
            <Paper sx={{ backgroundColor: '#1a1a1a', p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                Scheduled Posts ({scheduledPosts.length})
              </Typography>
              
              {scheduledPostsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: '#CBB3FF' }} />
                </Box>
              ) : scheduledPosts.length === 0 ? (
                <Typography variant="body1" sx={{ color: '#cccccc', textAlign: 'center', py: 4 }}>
                  No scheduled posts.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {scheduledPosts.map((post) => (
                    <Paper key={post.id} sx={{ backgroundColor: '#2a2a2a', p: 2, border: '1px solid #FFB385' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar
                              sx={{
                                bgcolor: post.display_avatar_color || '#CBB3FF',
                                width: 32,
                                height: 32,
                                mr: 2,
                                fontSize: '0.9rem'
                              }}
                            >
                              {(post.display_username || 'U').charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography 
                                variant="subtitle1" 
                                sx={{ 
                                  color: post.display_avatar_color || '#ffffff', 
                                  fontWeight: 'bold' 
                                }}
                              >
                                @{post.display_username}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#FFB385', fontWeight: 'bold' }}>
                                ⏰ {formatTimeRemaining(post.scheduled_at)}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="body1" sx={{ color: '#ffffff', ml: 6 }}>
                            {post.content}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#cccccc', ml: 6, display: 'block', mt: 1 }}>
                            Scheduled for: {new Date(post.scheduled_at).toLocaleString()}
                          </Typography>
                        </Box>
                        <IconButton
                          onClick={() => handleDeleteScheduledPost(post.id)}
                          sx={{ 
                            color: '#ff4444',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 68, 68, 0.1)',
                            },
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </Paper>
          )}
          
          {/* Existing Engagement Posts List */}
          <Paper sx={{ backgroundColor: '#1a1a1a', p: 3 }}>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
              Existing Engagement Posts ({engagementPosts.length})
            </Typography>
            
            {engagementPostsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#CBB3FF' }} />
              </Box>
            ) : engagementPosts.length === 0 ? (
              <Typography variant="body1" sx={{ color: '#cccccc', textAlign: 'center', py: 4 }}>
                No engagement posts created yet.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {engagementPosts.map((post) => (
                  <Paper 
                    key={post.id} 
                    sx={{ 
                      backgroundColor: '#2a2a2a', 
                      p: 2,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        backgroundColor: '#353535',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      }
                    }}
                    onClick={() => handleOpenCommentsModal(post)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar
                            sx={{
                              bgcolor: post.display_avatar_color || '#CBB3FF',
                              width: 32,
                              height: 32,
                              mr: 2,
                              fontSize: '0.9rem'
                            }}
                          >
                            {(post.display_username || 'U').charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography 
                              variant="subtitle1" 
                              sx={{ 
                                color: post.display_avatar_color || '#ffffff', 
                                fontWeight: 'bold' 
                              }}
                            >
                              @{post.display_username}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#cccccc' }}>
                              {new Date(post.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })} • 
                              {editingLikeCount === post.id ? (
                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, ml: 1 }}>
                                  <TextField
                                    type="number"
                                    value={newLikeCount}
                                    onChange={(e) => setNewLikeCount(parseInt(e.target.value) || 0)}
                                    size="small"
                                    inputProps={{ min: 0, style: { color: '#ffffff', fontSize: '0.75rem' } }}
                                    sx={{
                                      width: '60px',
                                      '& .MuiInputBase-root': {
                                        backgroundColor: '#2a2a2a',
                                        fontSize: '0.75rem',
                                      },
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#444444',
                                      },
                                    }}
                                  />
                                  <Button
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateLikeCount(post.id);
                                    }}
                                    sx={{
                                      backgroundColor: '#A9E5BB',
                                      color: '#000000',
                                      fontSize: '0.7rem',
                                      minWidth: 'auto',
                                      px: 1,
                                      '&:hover': { backgroundColor: '#8dd4a8' },
                                    }}
                                  >
                                    ✓
                                  </Button>
                                  <Button
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancelEditLikeCount();
                                    }}
                                    sx={{
                                      backgroundColor: '#ff6b6b',
                                      color: '#ffffff',
                                      fontSize: '0.7rem',
                                      minWidth: 'auto',
                                      px: 1,
                                      '&:hover': { backgroundColor: '#ff5252' },
                                    }}
                                  >
                                    ✕
                                  </Button>
                                </Box>
                              ) : (
                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, ml: 1 }}>
                                  <span>{post.like_count} likes</span>
                                  <Button
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartEditLikeCount(post.id, post.like_count || 0);
                                    }}
                                    sx={{
                                      backgroundColor: 'transparent',
                                      color: '#CBB3FF',
                                      fontSize: '0.7rem',
                                      minWidth: 'auto',
                                      px: 1,
                                      border: '1px solid #CBB3FF',
                                      '&:hover': { backgroundColor: 'rgba(203, 179, 255, 0.1)' },
                                    }}
                                  >
                                    Edit
                                  </Button>
                                </Box>
                              )}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body1" sx={{ color: '#ffffff', ml: 6 }}>
                          {post.content}
                        </Typography>
                        <Box sx={{ ml: 6, mt: 2, display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ 
                            color: '#CBB3FF', 
                            backgroundColor: 'rgba(203, 179, 255, 0.1)',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.7rem'
                          }}>
                            💬 Click to view/add comments
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEngagementPost(post.id);
                        }}
                        sx={{ 
                          color: '#ff4444',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 68, 68, 0.1)',
                          },
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      );
    };

    const renderEngagementComments = () => {
      return (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
              Engagement Comments Management
            </Typography>
            <Button
              variant={postFilter === 'engagement' ? "contained" : "outlined"}
              onClick={() => setPostFilter(postFilter === 'all' ? 'engagement' : 'all')}
              sx={{
                color: postFilter === 'engagement' ? '#000000' : '#CBB3FF',
                backgroundColor: postFilter === 'engagement' ? '#CBB3FF' : 'transparent',
                borderColor: '#CBB3FF',
                '&:hover': {
                  borderColor: '#A9E5BB',
                  backgroundColor: postFilter === 'engagement' ? '#A9E5BB' : 'rgba(203, 179, 255, 0.1)',
                },
              }}
            >
              {postFilter === 'all' ? 'Show All Posts' : 'Show Engagement Posts Only'}
            </Button>
          </Box>
          
          <Paper sx={{ backgroundColor: '#1a1a1a', p: 3 }}>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
              Posts Feed - Click any post to add comments
            </Typography>
            
            {allPostsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress color="primary" />
              </Box>
            ) : allPosts.length === 0 ? (
              <Typography variant="body1" sx={{ color: '#cccccc', textAlign: 'center', py: 4 }}>
                No posts found. {postFilter === 'engagement' ? 'Try switching to "All Posts" or create some engagement posts first.' : ''}
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {allPosts.map((post) => (
                  <Paper 
                    key={post.id}
                    onClick={() => handleOpenCommentModal(post)}
                    sx={{ 
                      backgroundColor: '#2a2a2a', 
                      p: 3, 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: '#333333',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(203, 179, 255, 0.2)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: post.display_avatar_color || post.avatar_color || '#CBB3FF',
                          width: 40,
                          height: 40,
                          mr: 2,
                        }}
                      >
                        {(post.display_username || post.username || 'U').charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            color: post.display_avatar_color || post.avatar_color || '#ffffff', 
                            fontWeight: 'bold' 
                          }}
                        >
                          @{post.display_username || post.username || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#cccccc' }}>
                          {new Date(post.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })} • {post.like_count || 0} likes • {post.comment_count || 0} comments
                        </Typography>
                      </Box>
                      {post.display_username && (
                        <Chip
                          label="Engagement Post"
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(203, 179, 255, 0.2)',
                            color: '#CBB3FF',
                            fontSize: '0.7rem'
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="body1" sx={{ color: '#ffffff', ml: 7 }}>
                      {post.content}
                    </Typography>
                    <Box sx={{ ml: 7, mt: 2, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ 
                        color: '#CBB3FF', 
                        backgroundColor: 'rgba(203, 179, 255, 0.1)',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.7rem'
                      }}>
                        💬 Click to view/add comments
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      );
    };

    const renderOnboardingAnalytics = () => {
      // Dummy/sandbox data
      const sandboxData = [
        { step_name: 'welcome', views: 10000, completions: 9500, completion_rate: 95.0 },
        { step_name: 'reason', views: 9500, completions: 9000, completion_rate: 94.7 },
        { step_name: 'mood-check', views: 9000, completions: 8500, completion_rate: 94.4 },
        { step_name: 'journaling-experience', views: 8500, completions: 8000, completion_rate: 94.1 },
        { step_name: 'user-details', views: 8000, completions: 7500, completion_rate: 93.8 },
        { step_name: 'solution', views: 7500, completions: 7000, completion_rate: 93.3 },
        { step_name: 'chart', views: 7000, completions: 6500, completion_rate: 92.9 },
        { step_name: 'goals', views: 6500, completions: 6000, completion_rate: 92.3 },
        { step_name: 'time-preference', views: 6000, completions: 5500, completion_rate: 91.7 },
        { step_name: 'testimonials', views: 5500, completions: 4800, completion_rate: 87.3 },
        { step_name: 'referral', views: 4800, completions: 4200, completion_rate: 87.5 },
        { step_name: 'outcome-preview', views: 4200, completions: 3800, completion_rate: 90.5 },
        { step_name: 'paywall', views: 3800, completions: 2500, completion_rate: 65.8 },
        { step_name: 'special-offer', views: 2500, completions: 2000, completion_rate: 80.0 },
      ];

      const displayData = useSandboxData ? sandboxData : onboardingAnalytics;
      const isLoading = useSandboxData ? false : onboardingAnalyticsLoading;
      const isEmpty = useSandboxData ? false : displayData.length === 0;

      return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
          <Paper sx={{ backgroundColor: '#2a2a2a', p: 4, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ color: '#ffffff' }}>
                Onboarding Analytics - User Drop-off Analysis
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={useSandboxData}
                    onChange={(e) => setUseSandboxData(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#A9E5BB',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#A9E5BB',
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: '#ffffff', fontWeight: useSandboxData ? 'bold' : 'normal' }}>
                    Sandbox Data
                  </Typography>
                }
                sx={{ ml: 0 }}
              />
            </Box>
            
            {useSandboxData && (
              <Alert severity="info" sx={{ mb: 3, backgroundColor: '#1a1a1a', color: '#A9E5BB', border: '1px solid #A9E5BB' }}>
                Showing dummy/sandbox data for demonstration purposes
              </Alert>
            )}
            
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={30} sx={{ color: '#A9E5BB' }} />
              </Box>
            ) : isEmpty ? (
              <Box sx={{ textAlign: 'center', py: 4, color: '#cccccc' }}>
                No onboarding analytics data found
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', borderBottom: '1px solid #666666' }}>
                        Step Name
                      </TableCell>
                      <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', borderBottom: '1px solid #666666' }} align="right">
                        Views
                      </TableCell>
                      <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', borderBottom: '1px solid #666666' }} align="right">
                        Completions
                      </TableCell>
                      <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', borderBottom: '1px solid #666666' }} align="right">
                        Completion Rate
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayData.map((step) => {
                      const completionRate = step.completion_rate;
                      const isLowRate = completionRate < 50;
                      const isMediumRate = completionRate >= 50 && completionRate < 75;
                      const isHighRate = completionRate >= 75;
                      
                      return (
                        <TableRow key={step.step_name}>
                          <TableCell sx={{ color: '#ffffff', borderBottom: '1px solid #333333' }}>
                            {step.step_name}
                          </TableCell>
                          <TableCell sx={{ color: '#cccccc', borderBottom: '1px solid #333333' }} align="right">
                            {step.views.toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ color: '#cccccc', borderBottom: '1px solid #333333' }} align="right">
                            {step.completions.toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #333333' }} align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                              <Typography
                                sx={{
                                  color: isLowRate ? '#ff5252' : isMediumRate ? '#ff9800' : '#4caf50',
                                  fontWeight: 'bold',
                                }}
                              >
                                {completionRate.toFixed(1)}%
                              </Typography>
                              {isLowRate && (
                                <Chip
                                  label="Low"
                                  size="small"
                                  sx={{
                                    backgroundColor: '#ff5252',
                                    color: '#ffffff',
                                    fontSize: '0.7rem',
                                    height: '20px',
                                  }}
                                />
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      );
    };

    // Home Dashboard render function
    const renderHome = () => {
      const periodLabels: Record<string, string> = {
        week: 'This Week',
        month: 'This Month',
        sixMonths: 'Last 6 Months',
        year: 'This Year',
        all: 'All Time'
      };
      
      const communityPeriodLabels: Record<string, string> = {
        day: '24 Hours',
        threeDay: '3 Days',
        week: '7 Days',
        month: '30 Days'
      };
      
      // Calculate total posts and comments for the period
      const totalPosts = communityStats.reduce((sum, stat) => sum + stat.posts, 0);
      const totalComments = communityStats.reduce((sum, stat) => sum + stat.comments, 0);

      return (
        <Box>
          <Typography variant="h4" sx={{ color: '#ffffff', mb: 3, fontWeight: 600 }}>
            📊 Dashboard Overview
          </Typography>
          
          {homeStatsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress sx={{ color: '#A9E5BB' }} />
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
              {/* Subscriptions Card (Combined) */}
              <Paper sx={{ 
                backgroundColor: '#1a1a1a', 
                borderRadius: 3, 
                p: 3,
                border: '1px solid #333333',
                gridColumn: { xs: '1', md: '1 / -1' }
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#CBB3FF', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CardGiftcardIcon /> Subscriptions
                  </Typography>
                  <FormControl size="small">
                    <Select
                      value={userStatsPeriod}
                      onChange={(e) => setUserStatsPeriod(e.target.value as any)}
                      sx={{
                        color: '#ffffff',
                        backgroundColor: '#2a2a2a',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444444' },
                        '& .MuiSvgIcon-root': { color: '#ffffff' },
                        minWidth: 100,
                      }}
                    >
                      <MenuItem value="week">Week</MenuItem>
                      <MenuItem value="month">Month</MenuItem>
                      <MenuItem value="sixMonths">6 Months</MenuItem>
                      <MenuItem value="year">Year</MenuItem>
                      <MenuItem value="all">All</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                {/* Active/Inactive Subscriptions Section */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                  {/* Active Subscriptions Box */}
                  <Box sx={{ 
                    backgroundColor: '#2a2a2a', 
                    borderRadius: 2, 
                    p: 3,
                    border: '2px solid #4caf50',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h3" sx={{ color: '#4caf50', fontWeight: 700, mb: 1 }}>
                      {userStats?.active?.[userStatsPeriod]?.toLocaleString() || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888888' }}>
                      {userStatsPeriod === 'all' ? 'Total Active' : `New Subscriptions (${periodLabels[userStatsPeriod]})`}
                    </Typography>
                  </Box>
                  
                  {/* Inactive Subscriptions Box */}
                  <Box sx={{ 
                    backgroundColor: '#2a2a2a', 
                    borderRadius: 2, 
                    p: 3,
                    border: '2px solid #f44336',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h3" sx={{ color: '#f44336', fontWeight: 700, mb: 1 }}>
                      {userStats?.inactive?.[userStatsPeriod]?.toLocaleString() || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888888' }}>
                      {userStatsPeriod === 'all' ? 'Total Inactive' : `Churned (${periodLabels[userStatsPeriod]})`}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Churn Rate */}
                <Box sx={{ 
                  mb: 3, 
                  pt: 2, 
                  borderTop: '1px solid #333333',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography variant="body2" sx={{ color: '#888888' }}>
                    Total: <strong style={{ color: '#ffffff' }}>{userStats?.total?.toLocaleString() || 0}</strong> users
                  </Typography>
                  <Box sx={{ 
                    backgroundColor: userStats?.churnRate && userStats.churnRate > 10 ? '#3d1a1a' : '#2a2a2a',
                    borderRadius: 1,
                    px: 2,
                    py: 0.5
                  }}>
                    <Typography variant="body2" sx={{ 
                      color: userStats?.churnRate && userStats.churnRate > 10 ? '#ff6659' : '#888888',
                      fontWeight: 600
                    }}>
                      Churn: <span style={{ 
                        color: userStats?.churnRate && userStats.churnRate > 10 ? '#f44336' : '#ffffff' 
                      }}>{userStats?.churnRate || 0}%</span>
                    </Typography>
                  </Box>
                </Box>
                
                {/* Subscription Types Breakdown */}
                <Box sx={{ 
                  pt: 2, 
                  borderTop: '1px solid #333333'
                }}>
                  <Typography variant="subtitle2" sx={{ color: '#cccccc', mb: 1.5 }}>
                    Subscription Types ({periodLabels[userStatsPeriod]})
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                    <Box sx={{ 
                      backgroundColor: '#2a2a2a', 
                      borderRadius: 2, 
                      p: 1.5,
                      textAlign: 'center',
                      border: '1px solid #4caf50'
                    }}>
                      <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 700 }}>
                        {subscriptionStats?.monthly?.[userStatsPeriod] || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888888' }}>
                        Monthly
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      backgroundColor: '#2a2a2a', 
                      borderRadius: 2, 
                      p: 1.5,
                      textAlign: 'center',
                      border: '1px solid #2196f3'
                    }}>
                      <Typography variant="h5" sx={{ color: '#2196f3', fontWeight: 700 }}>
                        {subscriptionStats?.yearly?.[userStatsPeriod] || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888888' }}>
                        Yearly
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      backgroundColor: '#2a2a2a', 
                      borderRadius: 2, 
                      p: 1.5,
                      textAlign: 'center',
                      border: '1px solid #ff9800'
                    }}>
                      <Typography variant="h5" sx={{ color: '#ff9800', fontWeight: 700 }}>
                        {subscriptionStats?.specialOffer?.[userStatsPeriod] || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888888' }}>
                        Special Offer
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      backgroundColor: '#2a2a2a', 
                      borderRadius: 2, 
                      p: 1.5,
                      textAlign: 'center',
                      border: '1px solid #9c27b0'
                    }}>
                      <Typography variant="h5" sx={{ color: '#9c27b0', fontWeight: 700 }}>
                        {subscriptionStats?.restoredPromo?.[userStatsPeriod] || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888888' }}>
                        Restored/Promo
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
              
              {/* Support & Reports Row */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                {/* Support Tickets Card */}
                <Paper sx={{ 
                  backgroundColor: '#1a1a1a', 
                  borderRadius: 3, 
                  p: 3,
                  border: '1px solid #333333'
                }}>
                  <Typography variant="h6" sx={{ color: '#FFB385', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SupportIcon /> Support Tickets
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                    <Box sx={{ 
                      backgroundColor: '#2a2a2a', 
                      borderRadius: 2, 
                      p: 1.5,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h5" sx={{ color: '#ff5252', fontWeight: 700 }}>
                        {supportStats?.open || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888888' }}>
                        Open
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      backgroundColor: '#2a2a2a', 
                      borderRadius: 2, 
                      p: 1.5,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h5" sx={{ color: '#ff9800', fontWeight: 700 }}>
                        {supportStats?.inProgress || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888888' }}>
                        Pending
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      backgroundColor: '#2a2a2a', 
                      borderRadius: 2, 
                      p: 1.5,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 700 }}>
                        {supportStats?.resolved || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888888' }}>
                        Resolved
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      backgroundColor: '#2a2a2a', 
                      borderRadius: 2, 
                      p: 1.5,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h5" sx={{ color: '#666666', fontWeight: 700 }}>
                        {supportStats?.closed || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888888' }}>
                        Closed
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #333333' }}>
                    <Typography variant="body2" sx={{ color: '#ffffff', textAlign: 'center' }}>
                      Total: <strong>{supportStats?.total || 0}</strong> tickets
                    </Typography>
                  </Box>
                </Paper>

                {/* Reports Card */}
                <Paper sx={{ 
                  backgroundColor: '#1a1a1a', 
                  borderRadius: 3, 
                  p: 3,
                  border: '1px solid #333333'
                }}>
                  <Typography variant="h6" sx={{ color: '#FF8A80', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReportIcon /> Community Reports
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                    <Box sx={{ 
                      backgroundColor: '#2a2a2a', 
                      borderRadius: 2, 
                      p: 1.5,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h5" sx={{ color: '#ff5252', fontWeight: 700 }}>
                        {reportStats?.pending || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888888' }}>
                        Pending
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      backgroundColor: '#2a2a2a', 
                      borderRadius: 2, 
                      p: 1.5,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h5" sx={{ color: '#ff9800', fontWeight: 700 }}>
                        {reportStats?.reviewed || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888888' }}>
                        Reviewed
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      backgroundColor: '#2a2a2a', 
                      borderRadius: 2, 
                      p: 1.5,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 700 }}>
                        {reportStats?.resolved || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888888' }}>
                        Resolved
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      backgroundColor: '#2a2a2a', 
                      borderRadius: 2, 
                      p: 1.5,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h5" sx={{ color: '#666666', fontWeight: 700 }}>
                        {reportStats?.dismissed || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888888' }}>
                        Dismissed
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #333333' }}>
                    <Typography variant="body2" sx={{ color: '#ffffff', textAlign: 'center' }}>
                      Total: <strong>{reportStats?.total || 0}</strong> reports
                    </Typography>
                  </Box>
                </Paper>
              </Box>
              
              {/* Community Activity Card */}
              <Paper sx={{ 
                backgroundColor: '#1a1a1a', 
                borderRadius: 3, 
                p: 3,
                border: '1px solid #333333'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#B3E5FC', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon /> Community Activity
                  </Typography>
                  <FormControl size="small">
                    <Select
                      value={communityPeriod}
                      onChange={(e) => setCommunityPeriod(e.target.value as any)}
                      sx={{
                        color: '#ffffff',
                        backgroundColor: '#2a2a2a',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444444' },
                        '& .MuiSvgIcon-root': { color: '#ffffff' },
                        minWidth: 100,
                      }}
                    >
                      <MenuItem value="day">Day</MenuItem>
                      <MenuItem value="threeDay">3 Days</MenuItem>
                      <MenuItem value="week">Week</MenuItem>
                      <MenuItem value="month">Month</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  <Box sx={{ 
                    backgroundColor: '#2a2a2a', 
                    borderRadius: 2, 
                    p: 2,
                    textAlign: 'center',
                    border: '1px solid #B3E5FC'
                  }}>
                    <Typography variant="h4" sx={{ color: '#B3E5FC', fontWeight: 700 }}>
                      {totalPosts}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888888' }}>
                      Posts ({communityPeriodLabels[communityPeriod]})
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    backgroundColor: '#2a2a2a', 
                    borderRadius: 2, 
                    p: 2,
                    textAlign: 'center',
                    border: '1px solid #CBB3FF'
                  }}>
                    <Typography variant="h4" sx={{ color: '#CBB3FF', fontWeight: 700 }}>
                      {totalComments}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888888' }}>
                      Comments ({communityPeriodLabels[communityPeriod]})
                    </Typography>
                  </Box>
                </Box>
                
                {/* Simple bar visualization */}
                <Box sx={{ 
                  backgroundColor: '#2a2a2a', 
                  borderRadius: 2, 
                  p: 2,
                  maxHeight: 150,
                  overflow: 'auto'
                }}>
                  {communityStats.length === 0 ? (
                    <Typography variant="body2" sx={{ color: '#666666', textAlign: 'center' }}>
                      No activity data
                    </Typography>
                  ) : (
                    [...communityStats].reverse().map((stat, index) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: '#888888' }}>
                            {new Date(stat.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#ffffff' }}>
                            {stat.posts}p / {stat.comments}c
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, height: 8 }}>
                          <Box 
                            sx={{ 
                              backgroundColor: '#B3E5FC', 
                              borderRadius: 1,
                              height: '100%',
                              width: `${Math.min((stat.posts / Math.max(totalPosts, 1)) * 100, 100)}%`,
                              minWidth: stat.posts > 0 ? 4 : 0,
                              transition: 'width 0.3s'
                            }} 
                          />
                          <Box 
                            sx={{ 
                              backgroundColor: '#CBB3FF', 
                              borderRadius: 1,
                              height: '100%',
                              width: `${Math.min((stat.comments / Math.max(totalComments, 1)) * 100, 100)}%`,
                              minWidth: stat.comments > 0 ? 4 : 0,
                              transition: 'width 0.3s'
                            }} 
                          />
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              </Paper>
              
              {/* Popular Referral Codes Card - Full Width */}
              <Paper sx={{ 
                backgroundColor: '#1a1a1a', 
                borderRadius: 3, 
                p: 3,
                border: '1px solid #333333',
                gridColumn: { xs: '1', md: '1 / -1' }
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#A9E5BB', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CardGiftcardIcon /> Popular Referral Codes
                  </Typography>
                  <FormControl size="small">
                    <Select
                      value={referralPeriod}
                      onChange={(e) => setReferralPeriod(e.target.value as any)}
                      sx={{
                        color: '#ffffff',
                        backgroundColor: '#2a2a2a',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444444' },
                        '& .MuiSvgIcon-root': { color: '#ffffff' },
                        minWidth: 120,
                      }}
                    >
                      <MenuItem value="week">Week</MenuItem>
                      <MenuItem value="month">Month</MenuItem>
                      <MenuItem value="sixMonths">6 Months</MenuItem>
                      <MenuItem value="year">Year</MenuItem>
                      <MenuItem value="all">All Time</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ 
                  maxHeight: 300, 
                  overflow: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: '#2a2a2a',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#444444',
                    borderRadius: '4px',
                    '&:hover': {
                      backgroundColor: '#555555',
                    },
                  },
                }}>
                  {popularReferrals.length === 0 ? (
                    <Typography variant="body2" sx={{ color: '#666666', textAlign: 'center', py: 2 }}>
                      No referral codes used in this period
                    </Typography>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: '#888888', borderBottom: '1px solid #333333' }}>#</TableCell>
                          <TableCell sx={{ color: '#888888', borderBottom: '1px solid #333333' }}>Referral Code</TableCell>
                          <TableCell align="right" sx={{ color: '#888888', borderBottom: '1px solid #333333' }}>Uses</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {popularReferrals.slice(0, 20).map((referral, index) => (
                          <TableRow key={referral.code} sx={{ '&:hover': { backgroundColor: '#2a2a2a' } }}>
                            <TableCell sx={{ color: '#666666', borderBottom: '1px solid #2a2a2a' }}>
                              {index + 1}
                            </TableCell>
                            <TableCell sx={{ color: '#ffffff', borderBottom: '1px solid #2a2a2a' }}>
                              <Chip 
                                label={referral.code} 
                                size="small"
                                sx={{ 
                                  backgroundColor: index < 3 ? '#A9E5BB' : '#333333',
                                  color: index < 3 ? '#1a1a1a' : '#ffffff',
                                  fontWeight: index < 3 ? 600 : 400
                                }}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ 
                              color: index < 3 ? '#A9E5BB' : '#ffffff', 
                              borderBottom: '1px solid #2a2a2a',
                              fontWeight: index < 3 ? 700 : 400
                            }}>
                              {referral.count}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Box>
              </Paper>
            </Box>
          )}
        </Box>
      );
    };
    
    // App Settings (Force Update) render function
    const renderAppSettings = () => {
      return (
        <Box>
          <Typography variant="h4" sx={{ color: '#ffffff', mb: 3, fontWeight: 600 }}>
            ⚙️ App Settings
          </Typography>
          
          {/* iOS Update System Management Box */}
          <Paper 
            elevation={3} 
            sx={{ 
              backgroundColor: '#1a1a1a', 
              borderRadius: 2, 
              border: '1px solid #333333',
              p: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#ffffff', mr: 2 }}>
                📱 iOS Force Update System
              </Typography>
              <Chip 
                label={iosUpdateSettings.force_update_enabled ? 'Enabled' : 'Disabled'} 
                color={iosUpdateSettings.force_update_enabled ? 'success' : 'default'}
                size="small"
                sx={{ 
                  backgroundColor: iosUpdateSettings.force_update_enabled ? '#4caf50' : '#666666',
                  color: '#ffffff'
                }}
              />
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
              {/* Force Update Toggle */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#cccccc', mb: 1 }}>
                  Force Update Control
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant={iosUpdateSettings.force_update_enabled ? 'contained' : 'outlined'}
                    onClick={handleForceUpdateToggle}
                    disabled={iosUpdateSaving}
                    sx={{
                      backgroundColor: iosUpdateSettings.force_update_enabled ? '#4caf50' : 'transparent',
                      borderColor: iosUpdateSettings.force_update_enabled ? '#4caf50' : '#666666',
                      color: '#ffffff',
                      '&:hover': {
                        backgroundColor: iosUpdateSettings.force_update_enabled ? '#45a049' : 'rgba(102, 102, 102, 0.1)',
                      }
                    }}
                  >
                    {iosUpdateSettings.force_update_enabled ? 'Disable Force Update' : 'Enable Force Update'}
                  </Button>
                  {iosUpdateSaving && <CircularProgress size={20} sx={{ color: '#A9E5BB' }} />}
                </Box>
              </Box>
              
              {/* Version Status */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#cccccc', mb: 1 }}>
                  Version Status
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#ffffff' }}>
                    Current: {iosUpdateSettings.current_version}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#cccccc' }}>
                    →
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#A9E5BB' }}>
                    Latest: {iosUpdateSettings.latest_version}
                  </Typography>
                  {iosUpdateSettings.current_version !== iosUpdateSettings.latest_version && (
                    <Chip 
                      label="Update Available" 
                      size="small" 
                      sx={{ 
                        backgroundColor: '#ff9800', 
                        color: '#ffffff',
                        fontSize: '0.7rem'
                      }} 
                    />
                  )}
                </Box>
              </Box>
            </Box>
            
            {/* Custom Message Editor */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: '#cccccc', mb: 1 }}>
                Custom Update Message
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                value={iosUpdateSettings.custom_message}
                onChange={(e) => handleCustomMessageChange(e.target.value)}
                onBlur={saveIosUpdateSettings}
                placeholder="Enter custom message for update notification..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#2a2a2a',
                    color: '#ffffff',
                    '& fieldset': {
                      borderColor: '#666666',
                    },
                    '&:hover fieldset': {
                      borderColor: '#A9E5BB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#A9E5BB',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#ffffff',
                  },
                }}
              />
            </Box>
            
            {/* Current Version Editor */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ color: '#cccccc', minWidth: '120px' }}>
                Current Version:
              </Typography>
              <TextField
                size="small"
                value={iosUpdateSettings.current_version}
                onChange={(e) => handleCurrentVersionChange(e.target.value)}
                onBlur={saveIosUpdateSettings}
                placeholder="1.0.6"
                sx={{
                  width: '120px',
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#2a2a2a',
                    color: '#ffffff',
                    '& fieldset': {
                      borderColor: '#666666',
                    },
                    '&:hover fieldset': {
                      borderColor: '#A9E5BB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#A9E5BB',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#ffffff',
                  },
                }}
              />
              <Button
                size="small"
                onClick={fetchLatestAppStoreVersion}
                disabled={iosUpdateLoading}
                sx={{
                  color: '#A9E5BB',
                  borderColor: '#A9E5BB',
                  '&:hover': {
                    borderColor: '#CBB3FF',
                    backgroundColor: 'rgba(203, 179, 255, 0.1)',
                  }
                }}
                variant="outlined"
              >
                Refresh Latest
              </Button>
              {iosUpdateLoading && <CircularProgress size={16} sx={{ color: '#A9E5BB' }} />}
            </Box>
            
            {/* App Store Info */}
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#2a2a2a', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ color: '#888888' }}>
                App Store ID: 6747963200 | 
                <a 
                  href="https://apps.apple.com/us/app/momu-ai-journal/id6747963200" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#A9E5BB', textDecoration: 'none', marginLeft: '4px' }}
                >
                  View on App Store
                </a>
              </Typography>
            </Box>
          </Paper>
        </Box>
      );
    };

    return (
      <Box sx={{ width: '100%' }}>
        <Box sx={{ px: 0 }}>
          {currentTab === 0 && renderHome()}
          {currentTab === 1 && renderUsers()}
          {currentTab === 2 && renderPlayers()}
          {currentTab === 3 && renderSupportRequests()}
          {currentTab === 4 && renderReports()}
          {currentTab === 5 && renderReferral()}
          {currentTab === 6 && renderBannedUsers()}
          {currentTab === 7 && renderEngagementPosts()}
          {currentTab === 8 && renderEngagementComments()}
          {currentTab === 9 && renderOnboardingAnalytics()}
          {currentTab === 10 && renderAppSettings()}
        </Box>
      </Box>
    );
  };
  
  if (loading) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2c2c2c 0%, #333333 50%, #404040 100%)',
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2c2c2c 0%, #333333 50%, #404040 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Header */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          background: 'linear-gradient(to bottom right, #A9E5BB 0%, #FFB385 33%, #CBB3FF 66%, #B3E5FC 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          py: 1
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Menu button to expand sidebar when collapsed */}
            {!sidebarOpen && (
              <IconButton
                onClick={() => setSidebarOpen(true)}
                sx={{
                  color: '#333333',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography 
              variant="h4" 
              sx={{ 
                color: '#333333',
                fontWeight: 'bold',
              }}
            >
              Momu Admin Dashboard
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={fetchAllData}
              sx={{
                color: '#333333',
                borderColor: '#333333',
                '&:hover': {
                  borderColor: '#222222',
                  backgroundColor: 'rgba(51, 51, 51, 0.1)',
                },
              }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              onClick={logout}
              sx={{
                color: '#333333',
                borderColor: '#333333',
                '&:hover': {
                  borderColor: '#222222',
                  backgroundColor: 'rgba(51, 51, 51, 0.1)',
                },
              }}
            >
              Logout
            </Button>
      </Box>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <Drawer
          variant="persistent"
          open={sidebarOpen}
          sx={{
            width: sidebarOpen ? 280 : 64,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: sidebarOpen ? 280 : 64,
              boxSizing: 'border-box',
              backgroundColor: '#1a1a1a',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'width 0.3s ease',
              overflowX: 'hidden',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', p: 1, minHeight: 64 }}>
            <IconButton
              onClick={() => setSidebarOpen(!sidebarOpen)}
              sx={{
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          </Box>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
          <List sx={{ overflowY: 'auto', flex: 1, px: 1 }}>
            {/* Home */}
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={currentTab === 0}
                onClick={() => setCurrentTab(0)}
                sx={{
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(169, 229, 187, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(169, 229, 187, 0.3)',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: currentTab === 0 ? '#A9E5BB' : '#cccccc' }}>
                  <HomeIcon />
                </ListItemIcon>
                {sidebarOpen && (
                  <ListItemText 
                    primary="Home" 
                    sx={{ color: currentTab === 0 ? '#A9E5BB' : '#ffffff' }}
                  />
                )}
              </ListItemButton>
            </ListItem>
            
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
            
            {/* Users */}
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={currentTab === 1}
                onClick={() => setCurrentTab(1)}
                sx={{
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(169, 229, 187, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(169, 229, 187, 0.3)',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: currentTab === 1 ? '#A9E5BB' : '#cccccc' }}>
                  <PeopleIcon />
                </ListItemIcon>
                {sidebarOpen && (
                  <ListItemText 
                    primary={`Users (${users.length})`} 
                    sx={{ color: currentTab === 1 ? '#A9E5BB' : '#ffffff' }}
                  />
                )}
              </ListItemButton>
            </ListItem>
            {/* Admin */}
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={currentTab === 2}
                onClick={() => setCurrentTab(2)}
                sx={{
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(169, 229, 187, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(169, 229, 187, 0.3)',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: currentTab === 2 ? '#A9E5BB' : '#cccccc' }}>
                  <AdminPanelSettingsIcon />
                </ListItemIcon>
                {sidebarOpen && (
                  <ListItemText 
                    primary={`Admin (${players.length})`} 
                    sx={{ color: currentTab === 2 ? '#A9E5BB' : '#ffffff' }}
                  />
                )}
              </ListItemButton>
            </ListItem>
            {/* Support */}
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={currentTab === 3}
                onClick={() => setCurrentTab(3)}
                sx={{
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(169, 229, 187, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(169, 229, 187, 0.3)',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: currentTab === 3 ? '#A9E5BB' : '#cccccc' }}>
                  <SupportIcon />
                </ListItemIcon>
                {sidebarOpen && (
                  <ListItemText 
                    primary={`Support (${supportRequests.length})`} 
                    sx={{ color: currentTab === 3 ? '#A9E5BB' : '#ffffff' }}
                  />
                )}
              </ListItemButton>
            </ListItem>
            {/* Reports */}
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={currentTab === 4}
                onClick={() => setCurrentTab(4)}
                sx={{
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(169, 229, 187, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(169, 229, 187, 0.3)',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: currentTab === 4 ? '#A9E5BB' : '#cccccc' }}>
                  <ReportIcon />
                </ListItemIcon>
                {sidebarOpen && (
                  <ListItemText 
                    primary={`Reports (${reports.length})`} 
                    sx={{ color: currentTab === 4 ? '#A9E5BB' : '#ffffff' }}
                  />
                )}
              </ListItemButton>
            </ListItem>
            {/* Referral */}
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={currentTab === 5}
                onClick={() => setCurrentTab(5)}
                sx={{
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(169, 229, 187, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(169, 229, 187, 0.3)',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: currentTab === 5 ? '#A9E5BB' : '#cccccc' }}>
                  <CardGiftcardIcon />
                </ListItemIcon>
                {sidebarOpen && (
                  <ListItemText 
                    primary="Referral" 
                    sx={{ color: currentTab === 5 ? '#A9E5BB' : '#ffffff' }}
                  />
                )}
              </ListItemButton>
            </ListItem>
            {/* Banned */}
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={currentTab === 6}
                onClick={() => setCurrentTab(6)}
                sx={{
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(169, 229, 187, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(169, 229, 187, 0.3)',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: currentTab === 6 ? '#A9E5BB' : '#cccccc' }}>
                  <BlockIcon />
                </ListItemIcon>
                {sidebarOpen && (
                  <ListItemText 
                    primary={`Banned (${bannedUsers.length})`} 
                    sx={{ color: currentTab === 6 ? '#A9E5BB' : '#ffffff' }}
                  />
                )}
              </ListItemButton>
            </ListItem>
            {/* Engagement Posts */}
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={currentTab === 7}
                onClick={() => setCurrentTab(7)}
                sx={{
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(169, 229, 187, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(169, 229, 187, 0.3)',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: currentTab === 7 ? '#A9E5BB' : '#cccccc' }}>
                  <PostAddIcon />
                </ListItemIcon>
                {sidebarOpen && (
                  <ListItemText 
                    primary={`Engagement Posts (${engagementPosts.length})`} 
                    sx={{ color: currentTab === 7 ? '#A9E5BB' : '#ffffff' }}
                  />
                )}
              </ListItemButton>
            </ListItem>
            {/* Engagement Comments */}
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={currentTab === 8}
                onClick={() => setCurrentTab(8)}
                sx={{
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(169, 229, 187, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(169, 229, 187, 0.3)',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: currentTab === 8 ? '#A9E5BB' : '#cccccc' }}>
                  <CommentIcon />
                </ListItemIcon>
                {sidebarOpen && (
                  <ListItemText 
                    primary={`Engagement Comments (${allPosts.length})`} 
                    sx={{ color: currentTab === 8 ? '#A9E5BB' : '#ffffff' }}
                  />
                )}
              </ListItemButton>
            </ListItem>
            {/* Onboarding Analytics */}
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={currentTab === 9}
                onClick={() => setCurrentTab(9)}
                sx={{
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(169, 229, 187, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(169, 229, 187, 0.3)',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: currentTab === 9 ? '#A9E5BB' : '#cccccc' }}>
                  <AnalyticsIcon />
                </ListItemIcon>
                {sidebarOpen && (
                  <ListItemText 
                    primary="Onboarding Analytics" 
                    sx={{ color: currentTab === 9 ? '#A9E5BB' : '#ffffff' }}
                  />
                )}
              </ListItemButton>
            </ListItem>
            
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
            
            {/* App Settings */}
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={currentTab === 10}
                onClick={() => setCurrentTab(10)}
                sx={{
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(169, 229, 187, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(169, 229, 187, 0.3)',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: currentTab === 10 ? '#A9E5BB' : '#cccccc' }}>
                  <SettingsIcon />
                </ListItemIcon>
                {sidebarOpen && (
                  <ListItemText 
                    primary="App Settings" 
                    sx={{ color: currentTab === 10 ? '#A9E5BB' : '#ffffff' }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          </List>
        </Drawer>
        
        {/* Main Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <Container maxWidth="lg">
            <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', backgroundColor: 'transparent', boxShadow: 'none' }}>
              <Box sx={{ p: { xs: 2, md: 3 } }}>
                {renderTabContent()}
              </Box>
            </Paper>
          </Container>
        </Box>
      </Box>
      
      {/* User Details Modal - Shared between Users and Players tabs */}
      <Dialog
        open={userDetailsOpen}
        onClose={() => {
          console.log('Modal closing');
          setUserDetailsOpen(false);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#2a2a2a',
            color: '#ffffff',
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          color: '#ffffff',
          borderBottom: '1px solid #333333'
        }}>
          User Details
          <IconButton 
            onClick={() => setUserDetailsOpen(false)}
            sx={{ color: '#ffffff' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedUser && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: getAvatarColor(selectedUser.username || selectedUser.email), 
                    width: 80, 
                    height: 80, 
                    mr: 3,
                    fontSize: '2rem'
                  }}
                >
                  {getInitials(selectedUser.username || selectedUser.email)}
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 1 }}>
                    @{selectedUser.username || generateUsername(selectedUser.email)}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#cccccc' }}>
                    User ID: {selectedUser.id}
                  </Typography>
                  {selectedUser.name && (
                    <Typography variant="body1" sx={{ color: '#cccccc' }}>
                      Name: {selectedUser.name}
                    </Typography>
                  )}
                  {selectedUser.user_type && (
                    <Typography variant="body1" sx={{ color: '#cccccc' }}>
                      User Type: {selectedUser.user_type}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              <Paper sx={{ backgroundColor: '#1a1a1a', p: 2, mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                  Contact Information
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarIcon sx={{ color: '#CBB3FF', mr: 1 }} />
                  <Typography variant="body1" sx={{ color: '#ffffff' }}>
                    Joined: {new Date(selectedUser.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body1" sx={{ color: '#ffffff' }}>
                    Username: {selectedUser.username || 'Not set'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body1" sx={{ color: '#ffffff' }}>
                    Referral Code: {selectedUser.referral_code || 'Not set'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body1" sx={{ color: '#ffffff' }}>
                    Created At: {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Not available'}
                  </Typography>
                </Box>
                {selectedUser.subscription_expires_at && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1" sx={{ color: '#ffffff' }}>
                      Subscription Expires: {new Date(selectedUser.subscription_expires_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body1" sx={{ color: '#ffffff' }}>
                    Status: 
                  </Typography>
                  <Chip 
                    label={selectedUser.status === 'active' ? 'Active' : 'Inactive'} 
                    color={selectedUser.status === 'active' ? 'success' : 'error'}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Box>
              </Paper>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                  variant={activeTab === 0 ? "contained" : "outlined"}
                  onClick={() => handleUserDetailTabChange(0)}
                  sx={{
                    color: activeTab === 0 ? '#333333' : '#CBB3FF',
                    backgroundColor: activeTab === 0 ? '#CBB3FF' : 'transparent',
                    borderColor: '#CBB3FF',
                    '&:hover': {
                      borderColor: '#A9E5BB',
                      backgroundColor: activeTab === 0 ? '#CBB3FF' : 'rgba(203, 179, 255, 0.1)',
                    },
                  }}
                >
                  POSTS ({userPosts.length})
                </Button>
                <Button
                  variant={activeTab === 1 ? "contained" : "outlined"}
                  onClick={() => handleUserDetailTabChange(1)}
                  sx={{
                    color: activeTab === 1 ? '#333333' : '#FFB385',
                    backgroundColor: activeTab === 1 ? '#FFB385' : 'transparent',
                    borderColor: '#FFB385',
                    '&:hover': {
                      borderColor: '#B3E5FC',
                      backgroundColor: activeTab === 1 ? '#FFB385' : 'rgba(255, 179, 133, 0.1)',
                    },
                  }}
                >
                  COMMENTS ({userComments.length})
                </Button>
                <Button
                  variant={activeTab === 2 ? "contained" : "outlined"}
                  onClick={() => handleUserDetailTabChange(2)}
                  sx={{
                    color: activeTab === 2 ? '#333333' : '#CBB3FF',
                    backgroundColor: activeTab === 2 ? '#CBB3FF' : 'transparent',
                    borderColor: '#CBB3FF',
                    '&:hover': {
                      borderColor: '#A9E5BB',
                      backgroundColor: activeTab === 2 ? '#CBB3FF' : 'rgba(203, 179, 255, 0.1)',
                    },
                  }}
                >
                  SEND NOTIFICATION
                </Button>
                <Button
                  variant={activeTab === 3 ? "contained" : "outlined"}
                  onClick={() => handleUserDetailTabChange(3)}
                  sx={{
                    color: activeTab === 3 ? '#333333' : '#ff6b6b',
                    backgroundColor: activeTab === 3 ? '#ff6b6b' : 'transparent',
                    borderColor: '#ff6b6b',
                    '&:hover': {
                      borderColor: '#ff5252',
                      backgroundColor: activeTab === 3 ? '#ff6b6b' : 'rgba(255, 107, 107, 0.1)',
                    },
                  }}
                >
                  USER MANAGEMENT
                </Button>
              </Box>
              
              {/* Posts and Comments Content */}
              <Box sx={{ minHeight: 200 }}>
                {activeTab === 0 && (
                  <Box>
                    <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                      Posts
                    </Typography>
                    {postsLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress sx={{ color: '#CBB3FF' }} />
                      </Box>
                    ) : userPosts.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4, color: '#cccccc' }}>
                        No posts to show
                      </Box>
                    ) : (
                      <Box>
                        {userPosts.map((post, index) => (
                          <Paper key={post.id || index} sx={{ backgroundColor: '#1a1a1a', p: 2, mb: 2, position: 'relative' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ color: '#cccccc', mb: 1 }}>
                                  {new Date(post.created_at).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })}
                                </Typography>
                                <Typography variant="h6" sx={{ color: '#ffffff', mb: 1 }}>
                                  Post #{post.id?.substring(0, 8) || 'Unknown'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#ffffff' }}>
                                  {post.content || post.message || 'No content available'}
                                </Typography>
                              </Box>
                              {post.id && (
                                <IconButton
                                  onClick={() => handleDeletePost(post.id)}
                                  sx={{ 
                                    color: '#ff4444',
                                    '&:hover': {
                                      backgroundColor: 'rgba(255, 68, 68, 0.1)',
                                    },
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                            </Box>
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
                
                {activeTab === 1 && (
                  <Box>
                    <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                      Comments
                    </Typography>
                    {commentsLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress sx={{ color: '#FFB385' }} />
                      </Box>
                    ) : userComments.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4, color: '#cccccc' }}>
                        No comments to show
                      </Box>
                    ) : (
                      <Box>
                        {userComments.map((comment, index) => (
                          <Paper key={comment.id || index} sx={{ backgroundColor: '#1a1a1a', p: 2, mb: 2, position: 'relative' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ color: '#cccccc', mb: 1 }}>
                                  {new Date(comment.created_at).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#ffffff' }}>
                                  {comment.content || comment.message || 'No content available'}
                                </Typography>
                              </Box>
                              {comment.id && (
                                <IconButton
                                  onClick={() => handleDeleteComment(comment.id)}
                                  sx={{ 
                                    color: '#ff4444',
                                    '&:hover': {
                                      backgroundColor: 'rgba(255, 68, 68, 0.1)',
                                    },
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                            </Box>
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
                
                {activeTab === 2 && (
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 1 }}>
                      Send Custom Notification to {selectedUser ? (selectedUser.username || generateUsername(selectedUser.email)) : 'User'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#cccccc', mb: 3 }}>
                      Use this form to send a custom notification to this user. The notification will appear in their notification center.
                    </Typography>
                    
                    <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
                      <TextField
                        label="Notification Title *"
                        value={notificationTitle}
                        onChange={(e) => setNotificationTitle(e.target.value)}
                        required
                        fullWidth
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#1a1a1a',
                            color: '#ffffff',
                            '& fieldset': {
                              borderColor: '#333333',
                            },
                            '&:hover fieldset': {
                              borderColor: '#555555',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#CBB3FF',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: '#cccccc',
                            '&.Mui-focused': {
                              color: '#CBB3FF',
                            },
                          },
                        }}
                      />
                      
                      <TextField
                        label="Notification Message *"
                        value={notificationMessage}
                        onChange={(e) => setNotificationMessage(e.target.value)}
                        required
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#1a1a1a',
                            color: '#ffffff',
                            '& fieldset': {
                              borderColor: '#333333',
                            },
                            '&:hover fieldset': {
                              borderColor: '#555555',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#CBB3FF',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: '#cccccc',
                            '&.Mui-focused': {
                              color: '#CBB3FF',
                            },
                          },
                        }}
                      />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
                        <Button
                          onClick={handleSendNotification}
                          disabled={sendingNotification || !notificationTitle.trim() || !notificationMessage.trim()}
                          variant="contained"
                          sx={{
                            backgroundColor: '#CBB3FF',
                            color: '#333333',
                            fontWeight: 'bold',
                            px: 4,
                            py: 1.5,
                            '&:hover': {
                              backgroundColor: '#A9E5BB',
                            },
                            '&:disabled': {
                              backgroundColor: '#555555',
                              color: '#999999',
                            },
                          }}
                        >
                          {sendingNotification ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CircularProgress size={20} sx={{ color: '#333333' }} />
                              Sending...
                            </Box>
                          ) : (
                            'Send Notification'
                          )}
                        </Button>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 4 }}>
                      <Typography variant="h6" sx={{ color: '#ffffff' }}>
                        Previous Notifications
                      </Typography>
                      <Button 
                        onClick={async () => {
                          console.log('🔍 COMPREHENSIVE DEBUGGING');
                          console.log('===========================');
                          
                          // Step 1: Check current user
                          console.log('\n1️⃣ CHECKING CURRENT USER');
                          const { data: { user }, error: authError } = await supabase.auth.getUser();
                          
                          if (authError || !user) {
                            console.error('❌ No authenticated user:', authError);
                            return;
                          }
                          
                          console.log('✅ Current user:', user.email);
                          console.log('🆔 Current user ID:', user.id);
                          
                          // Step 2: Check admin status
                          console.log('\n2️⃣ CHECKING ADMIN STATUS');
                          const { data: profile, error: profileError } = await supabase
                            .from('user_profiles')
                            .select('user_type, id, username, name')
                            .eq('id', user.id)
                            .single();
                          
                          if (profileError) {
                            console.error('❌ Error checking profile:', profileError);
                            return;
                          }
                          
                          console.log('✅ User profile:', profile);
                          console.log('👤 User type:', profile?.user_type);
                          
                          if (profile?.user_type !== 'admin') {
                            console.error('❌ ISSUE FOUND: User is not admin!');
                            return;
                          }
                          
                          // Step 3: Test all notifications
                          console.log('\n3️⃣ TESTING ALL NOTIFICATIONS ACCESS');
                          const { data: allNotifications, error: allError } = await supabase
                            .from('community_notifications')
                            .select('*')
                            .order('created_at', { ascending: false })
                            .limit(10);
                          
                          if (allError) {
                            console.error('❌ Error reading all notifications:', allError);
                          } else {
                            console.log('✅ Can read all notifications');
                            console.log('📊 Total notifications found:', allNotifications?.length || 0);
                            
                            if (allNotifications && allNotifications.length > 0) {
                              console.log('📋 Recent notifications:');
                              allNotifications.forEach((notif, index) => {
                                console.log(`  ${index + 1}. User: ${notif.user_id}, Title: "${notif.title}"`);
                              });
                            }
                          }
                          
                          // Step 4: Test selected user notifications
                          if (!selectedUser) {
                            console.error('❌ No user selected');
                            return;
                          }
                          
                          console.log('\n4️⃣ TESTING SELECTED USER NOTIFICATIONS');
                          console.log('👤 Selected user:', selectedUser.id);
                          
                          const { data: userNotifications, error: userError } = await supabase
                            .from('community_notifications')
                            .select('*')
                            .eq('user_id', selectedUser.id)
                            .order('created_at', { ascending: false });
                          
                          if (userError) {
                            console.error('❌ Error reading user notifications:', userError);
                          } else {
                            console.log('✅ Can read user notifications');
                            console.log('📊 Notifications for this user:', userNotifications?.length || 0);
                            
                            if (userNotifications && userNotifications.length > 0) {
                              console.log('📋 User notifications:');
                              userNotifications.forEach((notif, index) => {
                                console.log(`  ${index + 1}. Title: "${notif.title}", Message: "${notif.message}"`);
                              });
                            }
                          }
                          
                          // Step 5: Test getUserNotifications function
                          console.log('\n5️⃣ TESTING getUserNotifications FUNCTION');
                          setNotificationsLoading(true);
                          
                          try {
                            const { data, error } = await getUserNotifications(selectedUser.id);
                            
                            if (error) {
                              console.error('❌ getUserNotifications failed:', error);
                            } else {
                              console.log('✅ getUserNotifications works');
                              console.log('📊 Function returned:', data?.length || 0, 'notifications');
                              console.log('📋 Data:', data);
                              
                              setPreviousNotifications(data || []);
                            }
                          } catch (err) {
                            console.error('❌ getUserNotifications exception:', err);
                          } finally {
                            setNotificationsLoading(false);
                          }
                          
                          console.log('\n🎯 DIAGNOSTIC COMPLETE');
                        }}
                        variant="outlined" 
                        size="small"
                        sx={{
                          color: '#CBB3FF',
                          borderColor: '#CBB3FF',
                          '&:hover': {
                            borderColor: '#A9E5BB',
                            backgroundColor: 'rgba(203, 179, 255, 0.1)',
                          },
                        }}
                      >
                        Debug
                      </Button>
                    </Box>
                    
                    {notificationsLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress sx={{ color: '#CBB3FF' }} />
                      </Box>
                    ) : previousNotifications.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4, color: '#cccccc' }}>
                        No previous notifications sent to this user
                      </Box>
                    ) : (
                      <Box>
                        {previousNotifications.map((notification, index) => (
                          <Paper key={notification.id || index} sx={{ backgroundColor: '#1a1a1a', p: 2, mb: 2 }}>
                            <Typography variant="body2" sx={{ color: '#cccccc', mb: 1 }}>
                              {new Date(notification.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#ffffff', mb: 1 }}>
                              {notification.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#ffffff' }}>
                              {notification.message}
                            </Typography>
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
                
                {activeTab === 3 && (
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 1 }}>
                      User Management for @{selectedUser ? (selectedUser.username || generateUsername(selectedUser.email)) : 'User'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#cccccc', mb: 3 }}>
                      Manage this user's account status and permissions.
                    </Typography>
                    
                    <Paper sx={{ backgroundColor: '#1a1a1a', p: 3, mb: 3 }}>
                      <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                        Community Ban Status
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body1" sx={{ color: '#ffffff', mr: 2 }}>
                          Community Access:
                        </Typography>
                        <Chip 
                          label={selectedUser?.community_banned === true ? 'Banned from Community' : 'Allowed to Post'} 
                          color={selectedUser?.community_banned === true ? 'error' : 'success'}
                          size="medium"
                        />

                      </Box>
                      
                      {selectedUser?.community_banned === true && (
                        <Box sx={{ mb: 2 }}>
                          {selectedUser?.ban_reason && (
                            <Typography variant="body2" sx={{ color: '#cccccc', mb: 1 }}>
                              <strong>Reason:</strong> {selectedUser.ban_reason}
                            </Typography>
                          )}
                          {selectedUser?.banned_until && (
                            <Typography variant="body2" sx={{ color: '#cccccc', mb: 1 }}>
                              <strong>Banned Until:</strong> {new Date(selectedUser.banned_until).toLocaleDateString()}
                            </Typography>
                          )}
                          {selectedUser?.banned_at && (
                            <Typography variant="body2" sx={{ color: '#cccccc', mb: 1 }}>
                              <strong>Banned On:</strong> {new Date(selectedUser.banned_at).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      )}
                      
                      {selectedUser?.community_banned === true ? (
                        <Box>
                          <Typography variant="body2" sx={{ color: '#cccccc', mb: 2 }}>
                            This user is banned from community features (posting, commenting).
                          </Typography>
                          <Button
                            variant="contained"
                            onClick={() => handleUnbanUser(selectedUser)}
                            disabled={unbanningUser}
                            sx={{
                              backgroundColor: '#4caf50',
                              color: '#ffffff',
                              '&:hover': {
                                backgroundColor: '#45a049',
                              },
                              '&:disabled': {
                                backgroundColor: '#666666',
                              },
                            }}
                          >
                            {unbanningUser ? 'Unbanning...' : 'Unban from Community'}
                          </Button>
                        </Box>
                      ) : (
                        <Box>
                          <Typography variant="body2" sx={{ color: '#cccccc', mb: 2 }}>
                            This user can post and comment in the community.
                          </Typography>
                          <Button
                            variant="contained"
                            onClick={() => handleBanUser(selectedUser)}
                            sx={{
                              backgroundColor: '#ff6b6b',
                              color: '#ffffff',
                              '&:hover': {
                                backgroundColor: '#ff5252',
                              },
                            }}
                          >
                            Ban from Community
                          </Button>
                        </Box>
                      )}
                    </Paper>
                    
                    <Paper sx={{ backgroundColor: '#1a1a1a', p: 3 }}>
                      <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                        Account Information
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#cccccc' }}>
                            User ID:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#ffffff', fontFamily: 'monospace' }}>
                            {selectedUser?.id}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#cccccc' }}>
                            Email:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#ffffff' }}>
                            {selectedUser?.email}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#cccccc' }}>
                            Username:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#ffffff' }}>
                            {selectedUser?.username || 'Not set'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#cccccc' }}>
                            User Type:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#ffffff' }}>
                            {selectedUser?.user_type || 'normal'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#cccccc' }}>
                            Joined:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#ffffff' }}>
                            {selectedUser?.created_at ? new Date(selectedUser.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Unknown'}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                )}
              </Box>
             
              <Typography variant="body2" sx={{ color: '#666666', mt: 2 }}>
                Debug Information:
              </Typography>
              <Typography variant="body2" sx={{ color: '#666666' }}>
                Fetching details for user ID: {selectedUser.id}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666666' }}>
                Found user: {selectedUser.name || 'undefined'}
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Support Request Details Modal */}
      <Dialog
        open={supportRequestModalOpen}
        onClose={handleCloseSupportRequestModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#2a2a2a',
            color: '#ffffff',
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          color: '#ffffff',
          borderBottom: '1px solid #333333'
        }}>
          Support Request Details
          <IconButton 
            onClick={handleCloseSupportRequestModal}
            sx={{ color: '#ffffff' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedSupportRequest && (
            <Box>
              {/* Status Update Section - Moved to top */}
              <Paper sx={{ backgroundColor: '#1a1a1a', p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                  Update Status
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {['open', 'in_progress', 'closed'].map((status) => (
                    <Button
                      key={status}
                      variant={selectedSupportRequest.status === status ? "contained" : "outlined"}
                      onClick={() => handleUpdateSupportRequestStatus(status)}
                      disabled={updatingStatus || selectedSupportRequest.status === status}
                      sx={{
                        color: selectedSupportRequest.status === status ? '#333333' : '#ffffff',
                        backgroundColor: selectedSupportRequest.status === status ? (
                          status === 'closed' ? '#4caf50' : 
                          status === 'in_progress' ? '#ff9800' : '#2196f3'
                        ) : 'transparent',
                        borderColor: status === 'closed' ? '#4caf50' : 
                                   status === 'in_progress' ? '#ff9800' : '#2196f3',
                        '&:hover': {
                          backgroundColor: status === 'closed' ? '#45a049' : 
                                         status === 'in_progress' ? '#f57c00' : '#1976d2',
                          color: '#ffffff',
                        },
                        textTransform: 'capitalize'
                      }}
                    >
                      {updatingStatus && selectedSupportRequest.status === status ? (
                        <CircularProgress size={20} sx={{ color: '#333333' }} />
                      ) : (
                        status.replace('_', ' ')
                      )}
                    </Button>
                  ))}
                </Box>
              </Paper>

              {/* Support Request Info */}
              <Paper sx={{ backgroundColor: '#1a1a1a', p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                  Request Information
                </Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#cccccc', mb: 0.5 }}>
                      Request ID:
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ffffff', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                      {selectedSupportRequest.id}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#cccccc', mb: 0.5 }}>
                      Subject:
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                      {selectedSupportRequest.subject}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#cccccc', mb: 0.5 }}>
                      Contact Email:
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ffffff' }}>
                      {selectedSupportRequest.email || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#cccccc', mb: 0.5 }}>
                      Name:
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ffffff' }}>
                      {selectedSupportRequest.name || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#cccccc', mb: 0.5 }}>
                      Message:
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ffffff', lineHeight: 1.6 }}>
                      {selectedSupportRequest.message}
                    </Typography>
                  </Box>
                  
                  {/* Screenshot Display */}
                  {selectedSupportRequest.has_screenshot && selectedSupportRequest.screenshot_path && (
                    <ScreenshotDisplay screenshotPath={selectedSupportRequest.screenshot_path} />
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#cccccc', mb: 0.5 }}>
                        Current Status:
                      </Typography>
                      <Chip 
                        label={selectedSupportRequest.status} 
                        color={
                          selectedSupportRequest.status === 'resolved' || selectedSupportRequest.status === 'closed' ? 'success' : 
                          selectedSupportRequest.status === 'in_progress' ? 'warning' : 
                          selectedSupportRequest.status === 'open' ? 'success' : 'default'
                        }
                        size="medium"
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#cccccc', mb: 0.5 }}>
                        Created:
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#ffffff' }}>
                        {new Date(selectedSupportRequest.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>

              {/* Enhanced User Information */}
              {selectedSupportRequest.user_id && (
                <Paper sx={{ backgroundColor: '#1a1a1a', p: 3, mb: 3 }}>
                  <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                    User Information
                  </Typography>
                  {supportRequestUserLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress sx={{ color: '#CBB3FF' }} />
                    </Box>
                  ) : supportRequestUser ? (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: getAvatarColor(supportRequestUser.username || supportRequestUser.email), 
                            width: 80, 
                            height: 80, 
                            mr: 3,
                            fontSize: '2rem'
                          }}
                        >
                          {getInitials(supportRequestUser.username || supportRequestUser.email)}
                        </Avatar>
                        <Box>
                          <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 1 }}>
                            @{supportRequestUser.username || generateUsername(supportRequestUser.email)}
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#cccccc' }}>
                            User ID: {supportRequestUser.id}
                          </Typography>
                          {supportRequestUser.name && (
                            <Typography variant="body1" sx={{ color: '#cccccc' }}>
                              Name: {supportRequestUser.name}
                            </Typography>
                          )}
                          {supportRequestUser.user_type && (
                            <Typography variant="body1" sx={{ color: '#cccccc' }}>
                              User Type: {supportRequestUser.user_type}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      
                      <Paper sx={{ backgroundColor: '#2a2a2a', p: 2, mb: 3 }}>
                        <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                          Contact Information
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CalendarIcon sx={{ color: '#CBB3FF', mr: 1 }} />
                          <Typography variant="body1" sx={{ color: '#ffffff' }}>
                            Joined: {new Date(supportRequestUser.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body1" sx={{ color: '#ffffff' }}>
                            Username: {supportRequestUser.username || 'Not set'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body1" sx={{ color: '#ffffff' }}>
                            Referral Code: {supportRequestUser.referral_code || 'Not set'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body1" sx={{ color: '#ffffff' }}>
                            Created At: {supportRequestUser.created_at ? new Date(supportRequestUser.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Not available'}
                          </Typography>
                        </Box>
                        {supportRequestUser.subscription_expires_at && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body1" sx={{ color: '#ffffff' }}>
                              Subscription Expires: {new Date(supportRequestUser.subscription_expires_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body1" sx={{ color: '#ffffff' }}>
                            Status: 
                          </Typography>
                          <Chip 
                            label={supportRequestUser.status === 'active' ? 'Active' : 'Inactive'} 
                            color={supportRequestUser.status === 'active' ? 'success' : 'error'}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      </Paper>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: getAvatarColor(selectedSupportRequest.email), 
                          width: 60, 
                          height: 60, 
                          mr: 2,
                          fontSize: '1.5rem'
                        }}
                      >
                        {getInitials(selectedSupportRequest.email)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                          @{selectedSupportRequest.username || generateUsername(selectedSupportRequest.email)}
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#cccccc' }}>
                          {selectedSupportRequest.email}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#cccccc' }}>
                          User ID: {selectedSupportRequest.user_id}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Paper>
              )}

              {/* Delete Section */}
              <Paper sx={{ backgroundColor: '#1a1a1a', p: 3 }}>
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                  Danger Zone
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={deletingSupportRequest}
                  startIcon={<DeleteIcon />}
                  sx={{
                    color: '#ff4444',
                    borderColor: '#ff4444',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 68, 68, 0.1)',
                      borderColor: '#ff6666',
                    },
                  }}
                >
                  {deletingSupportRequest ? 'Deleting...' : 'Delete Support Request'}
                </Button>
              </Paper>
            </Box>
          )}
        </DialogContent>
       </Dialog>

       {/* Delete Confirmation Dialog */}
       <Dialog
         open={deleteConfirmOpen}
         onClose={() => setDeleteConfirmOpen(false)}
         maxWidth="sm"
         fullWidth
         PaperProps={{
           sx: {
             backgroundColor: '#2a2a2a',
             color: '#ffffff',
             borderRadius: 2,
           }
         }}
       >
         <DialogTitle sx={{ 
           display: 'flex', 
           justifyContent: 'space-between', 
           alignItems: 'center',
           color: '#ffffff',
           borderBottom: '1px solid #333333'
         }}>
           Confirm Deletion
           <IconButton 
             onClick={() => setDeleteConfirmOpen(false)}
             sx={{ color: '#ffffff' }}
           >
             <CloseIcon />
           </IconButton>
         </DialogTitle>
         <DialogContent sx={{ p: 3 }}>
           <Box>
             <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
               Are you sure you want to delete this support request?
             </Typography>
             <Typography variant="body1" sx={{ color: '#cccccc', mb: 3 }}>
               This action will permanently delete the support request and its associated screenshot (if any). This action cannot be undone.
             </Typography>
             <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
               <Button
                 variant="outlined"
                 onClick={() => setDeleteConfirmOpen(false)}
                 disabled={deletingSupportRequest}
                 sx={{
                   color: '#ffffff',
                   borderColor: '#666666',
                   '&:hover': {
                     borderColor: '#888888',
                   },
                 }}
               >
                 Cancel
               </Button>
               <Button
                 variant="contained"
                 color="error"
                 onClick={handleDeleteSupportRequest}
                 disabled={deletingSupportRequest}
                 startIcon={deletingSupportRequest ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : <DeleteIcon />}
                 sx={{
                   backgroundColor: '#ff4444',
                   '&:hover': {
                     backgroundColor: '#ff6666',
                   },
                 }}
               >
                 {deletingSupportRequest ? 'Deleting...' : 'Delete'}
               </Button>
             </Box>
           </Box>
         </DialogContent>
       </Dialog>

       {/* Report Details Modal */}
       <Dialog
         open={reportModalOpen}
         onClose={handleCloseReportModal}
         maxWidth="md"
         fullWidth
         PaperProps={{
           sx: {
             backgroundColor: '#2a2a2a',
             color: '#ffffff',
             borderRadius: 2,
           }
         }}
       >
         <DialogTitle sx={{ 
           display: 'flex', 
           justifyContent: 'space-between', 
           alignItems: 'center',
           color: '#ffffff',
           borderBottom: '1px solid #333333'
         }}>
           Report Details
           <IconButton 
             onClick={handleCloseReportModal}
             sx={{ color: '#ffffff' }}
           >
             <CloseIcon />
           </IconButton>
         </DialogTitle>
         <DialogContent sx={{ p: 3 }}>
           {selectedReport && (
             <Box>
               {/* Report Information */}
               <Paper sx={{ backgroundColor: '#1a1a1a', p: 3, mb: 3 }}>
                 <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                   Report Information
                 </Typography>
                 <Box sx={{ display: 'grid', gap: 2 }}>
                   <Box>
                     <Typography variant="body2" sx={{ color: '#cccccc', mb: 0.5 }}>
                       Subject:
                     </Typography>
                     <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                       {selectedReport.reason}
                     </Typography>
                   </Box>
                   <Box>
                     <Typography variant="body2" sx={{ color: '#cccccc', mb: 0.5 }}>
                       Report Text:
                     </Typography>
                     <Typography variant="body1" sx={{ color: '#ffffff', lineHeight: 1.6 }}>
                       {selectedReport.description || 'No additional details provided'}
                     </Typography>
                   </Box>
                   <Box>
                     <Typography variant="body2" sx={{ color: '#cccccc', mb: 0.5 }}>
                       Reported:
                     </Typography>
                     <Typography variant="body1" sx={{ color: '#ffffff' }}>
                       {new Date(selectedReport.created_at).toLocaleDateString('en-US', { 
                         month: 'short', 
                         day: 'numeric', 
                         year: 'numeric',
                         hour: '2-digit',
                         minute: '2-digit'
                       })}
                     </Typography>
                   </Box>
                 </Box>
               </Paper>

               {/* Enhanced Reporter Information */}
               {selectedReport.reporter_id && (
                 <Paper sx={{ backgroundColor: '#1a1a1a', p: 3, mb: 3 }}>
                   <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                     Reporter Information
                   </Typography>
                   {reporterUserLoading ? (
                     <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                       <CircularProgress sx={{ color: '#CBB3FF' }} />
                     </Box>
                   ) : reporterUser ? (
                     <Box>
                       <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                         <Avatar 
                           sx={{ 
                             bgcolor: getAvatarColor(reporterUser.username || reporterUser.email), 
                             width: 80, 
                             height: 80, 
                             mr: 3,
                             fontSize: '2rem'
                           }}
                         >
                           {getInitials(reporterUser.username || reporterUser.email)}
                         </Avatar>
                         <Box>
                           <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 1 }}>
                             @{reporterUser.username || generateUsername(reporterUser.email)}
                           </Typography>
                           <Typography variant="body1" sx={{ color: '#cccccc' }}>
                             User ID: {reporterUser.id}
                           </Typography>
                           {reporterUser.name && (
                             <Typography variant="body1" sx={{ color: '#cccccc' }}>
                               Name: {reporterUser.name}
                             </Typography>
                           )}
                           {reporterUser.user_type && (
                             <Typography variant="body1" sx={{ color: '#cccccc' }}>
                               User Type: {reporterUser.user_type}
                             </Typography>
                           )}
                         </Box>
                       </Box>
                       

                     </Box>
                   ) : (
                     <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                       <Avatar 
                         sx={{ 
                           bgcolor: getAvatarColor(selectedReport.reporter?.name || selectedReport.reporter?.username), 
                           width: 50, 
                           height: 50, 
                           mr: 2,
                           fontSize: '1.2rem'
                         }}
                       >
                         {(selectedReport.reporter?.name || selectedReport.reporter?.username || 'U').charAt(0).toUpperCase()}
                       </Avatar>
                       <Box>
                         <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                           @{selectedReport.reporter?.username || selectedReport.reporter?.name || 'Unknown'}
                         </Typography>
                         <Typography variant="body1" sx={{ color: '#cccccc' }}>
                           {selectedReport.reporter?.name || 'No name provided'}
                         </Typography>
                       </Box>
                     </Box>
                   )}
                 </Paper>
               )}

               {/* Reported User Information */}
               {selectedReport.reported_user_id && (
                 <Paper sx={{ backgroundColor: '#1a1a1a', p: 3, mb: 3 }}>
                   <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                     Reported User Information
                   </Typography>
                   {reportedUserLoading ? (
                     <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                       <CircularProgress sx={{ color: '#FFB385' }} />
                     </Box>
                   ) : reportedUser ? (
                     <Box>
                       <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                         <Avatar 
                           sx={{ 
                             bgcolor: getAvatarColor(reportedUser.username || reportedUser.email), 
                             width: 80, 
                             height: 80, 
                             mr: 3,
                             fontSize: '2rem'
                           }}
                         >
                           {getInitials(reportedUser.username || reportedUser.email)}
                         </Avatar>
                         <Box>
                           <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 1 }}>
                             @{reportedUser.username || generateUsername(reportedUser.email)}
                           </Typography>
                           <Typography variant="body1" sx={{ color: '#cccccc' }}>
                             User ID: {reportedUser.id}
                           </Typography>
                           {reportedUser.name && (
                             <Typography variant="body1" sx={{ color: '#cccccc' }}>
                               Name: {reportedUser.name}
                             </Typography>
                           )}
                           {reportedUser.user_type && (
                             <Typography variant="body1" sx={{ color: '#cccccc' }}>
                               User Type: {reportedUser.user_type}
                             </Typography>
                           )}
                         </Box>
                       </Box>
                       

                     </Box>
                   ) : (
                     <Box sx={{ textAlign: 'center', py: 2, color: '#cccccc' }}>
                       User details not available
                     </Box>
                   )}
                 </Paper>
               )}

               {/* Reported Content */}
               <Paper sx={{ backgroundColor: '#1a1a1a', p: 3, mb: 3 }}>
                 <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                   Reported Content
                 </Typography>
                 
                 {reportedContentLoading ? (
                   <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                     <CircularProgress sx={{ color: '#ffffff' }} />
                   </Box>
                 ) : reportedContent ? (
                   <Paper sx={{ backgroundColor: '#2a2a2a', p: 2, position: 'relative' }}>
                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                       <Box sx={{ flex: 1 }}>
                         <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                           <Typography variant="body2" sx={{ color: '#cccccc' }}>
                             {reportedContent.type === 'post' ? 'Post' : 'Comment'} • {new Date(reportedContent.created_at).toLocaleDateString('en-US', { 
                               month: 'short', 
                               day: 'numeric', 
                               year: 'numeric' 
                             })}
                           </Typography>
                         </Box>
                         
                         {/* Content Author Information */}
                         <Box sx={{ mb: 2 }}>
                           <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                             @{reportedContent.username || reportedContent.author_username || 'Unknown User'}
                           </Typography>
                           <Typography variant="caption" sx={{ color: '#cccccc' }}>
                             User ID: {reportedContent.user_id || reportedContent.author_id || 'N/A'}
                           </Typography>
                         </Box>
                         
                         {reportedContent.type === 'post' && reportedContent.title && (
                           <Typography variant="h6" sx={{ color: '#ffffff', mb: 1 }}>
                             {reportedContent.title}
                           </Typography>
                         )}
                         <Typography variant="body2" sx={{ color: '#ffffff' }}>
                           {reportedContent.content || reportedContent.message || 'No content available'}
                         </Typography>
                       </Box>
                       <IconButton
                         onClick={handleDeleteReportedContent}
                         sx={{ 
                           color: '#ff4444',
                           '&:hover': {
                             backgroundColor: 'rgba(255, 68, 68, 0.1)',
                           },
                         }}
                       >
                         <DeleteIcon />
                       </IconButton>
                     </Box>
                   </Paper>
                 ) : (
                   <Box sx={{ textAlign: 'center', py: 4, color: '#cccccc' }}>
                     {selectedReport.post_id || selectedReport.comment_id ? 
                       'Content not found or has been deleted' : 
                       'No specific content was reported'
                     }
                   </Box>
                 )}
               </Paper>

               {/* Delete Report Section */}
               <Paper sx={{ backgroundColor: '#1a1a1a', p: 3 }}>
                 <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                   Danger Zone
                 </Typography>
                 <Button
                   variant="outlined"
                   color="error"
                   onClick={handleDeleteReport}
                   disabled={deletingReport}
                   startIcon={<DeleteIcon />}
                   sx={{
                     color: '#ff4444',
                     borderColor: '#ff4444',
                     '&:hover': {
                       backgroundColor: 'rgba(255, 68, 68, 0.1)',
                       borderColor: '#ff6666',
                     },
                   }}
                 >
                   {deletingReport ? 'Deleting...' : 'Delete Report'}
                 </Button>
               </Paper>
             </Box>
           )}
         </DialogContent>
       </Dialog>

      {/* Referral Redemptions Modal */}
      <Dialog
        open={referralModalOpen}
        onClose={() => setReferralModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#2a2a2a',
            color: '#ffffff',
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          color: '#ffffff',
          borderBottom: '1px solid #333333'
        }}>
          Referral Code: {selectedReferralCode}
          <IconButton 
            onClick={() => setReferralModalOpen(false)}
            sx={{ color: '#ffffff' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {referralRedemptionsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#A9E5BB' }} />
            </Box>
          ) : referralRedemptions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: '#cccccc' }}>
              No redemptions found for this referral code
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" sx={{ color: '#ffffff', mb: 3 }}>
                Users who redeemed this code ({referralRedemptions.length})
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {referralRedemptions.map((redemption) => (
                  <Paper
                    key={redemption.id}
                    sx={{
                      backgroundColor: '#1a1a1a',
                      p: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: getAvatarColor(redemption.user_email || redemption.user_username || ''),
                        width: 48,
                        height: 48,
                        fontSize: '1.2rem',
                      }}
                    >
                      {getInitials(redemption.user_email || redemption.user_username || '')}
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                        @{redemption.user_username || generateUsername(redemption.user_email || '')}
                      </Typography>
                      {redemption.user_email && (
                        <Typography variant="body2" sx={{ color: '#cccccc', mb: 1 }}>
                          {redemption.user_email}
                        </Typography>
                      )}
                      <Typography variant="body2" sx={{ color: '#A9E5BB' }}>
                        Redeemed: {new Date(redemption.redeemed_at).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Ban User Modal */}
      <Dialog
        open={banUserModalOpen}
        onClose={() => setBanUserModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#2a2a2a',
            color: '#ffffff',
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          color: '#ffffff',
          borderBottom: '1px solid #333333'
        }}>
          Ban User from Community
          <IconButton 
            onClick={() => setBanUserModalOpen(false)}
            sx={{ color: '#ffffff' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {userToBan && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: getAvatarColor(userToBan.username || userToBan.email), 
                    width: 60, 
                    height: 60, 
                    mr: 3,
                    fontSize: '1.5rem'
                  }}
                >
                  {getInitials(userToBan.username || userToBan.email)}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 1 }}>
                    @{userToBan.username || generateUsername(userToBan.email)}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#cccccc' }}>
                    {userToBan.email}
                  </Typography>
                  {userToBan.name && (
                    <Typography variant="body1" sx={{ color: '#cccccc' }}>
                      {userToBan.name}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                Ban User from Community Features
              </Typography>
              
              <Typography variant="body2" sx={{ color: '#cccccc', mb: 3 }}>
                This action will prevent the user from posting and commenting in the community. They will still be able to access other platform features.
              </Typography>
              
              <TextField
                label="Ban Reason (Optional)"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                placeholder="Enter the reason for banning this user from community features..."
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#1a1a1a',
                    color: '#ffffff',
                    '& fieldset': {
                      borderColor: '#333333',
                    },
                    '&:hover fieldset': {
                      borderColor: '#555555',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#f5f5f5',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#cccccc',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#666666',
                  },
                }}
              />
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ color: '#cccccc', mb: 1 }}>
                  Ban Type
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant={banType === 'permanent' ? 'contained' : 'outlined'}
                    onClick={() => setBanType('permanent')}
                    sx={{
                      backgroundColor: banType === 'permanent' ? '#ff6b6b' : 'transparent',
                      color: banType === 'permanent' ? '#ffffff' : '#ff6b6b',
                      borderColor: '#ff6b6b',
                      '&:hover': {
                        backgroundColor: banType === 'permanent' ? '#ff5252' : 'rgba(255, 107, 107, 0.1)',
                      },
                    }}
                  >
                    Permanent Ban
                  </Button>
                  <Button
                    variant={banType === 'temporary' ? 'contained' : 'outlined'}
                    onClick={() => setBanType('temporary')}
                    sx={{
                      backgroundColor: banType === 'temporary' ? '#ff6b6b' : 'transparent',
                      color: banType === 'temporary' ? '#ffffff' : '#ff6b6b',
                      borderColor: '#ff6b6b',
                      '&:hover': {
                        backgroundColor: banType === 'temporary' ? '#ff5252' : 'rgba(255, 107, 107, 0.1)',
                      },
                    }}
                  >
                    Temporary Ban
                  </Button>
                </Box>
              </FormControl>
              
              {banType === 'temporary' && (
                <TextField
                  label="Ban Until"
                  type="datetime-local"
                  value={banUntil}
                  onChange={(e) => setBanUntil(e.target.value)}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1a1a1a',
                      color: '#ffffff',
                      '& fieldset': {
                        borderColor: '#333333',
                      },
                      '&:hover fieldset': {
                        borderColor: '#555555',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#f5f5f5',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#cccccc',
                    },
                  }}
                />
              )}
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => setBanUserModalOpen(false)}
                  sx={{
                    color: '#cccccc',
                    borderColor: '#333333',
                    '&:hover': {
                      borderColor: '#555555',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleConfirmBanUser}
                  disabled={banningUser}
                  sx={{
                    backgroundColor: '#ff6b6b',
                    color: '#ffffff',
                    '&:hover': {
                      backgroundColor: '#ff5252',
                    },
                    '&:disabled': {
                      backgroundColor: '#666666',
                    },
                  }}
                >
                  {banningUser ? 'Banning...' : 'Ban from Community'}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Engagement Comments Modal */}
      <Dialog
        open={commentsModalOpen}
        onClose={handleCloseCommentsModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            color: '#ffffff',
            maxHeight: '80vh',
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#1a1a1a', 
          color: '#ffffff',
          borderBottom: '1px solid #333333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box>
            <Typography variant="h6">
              Comments for Post by @{selectedPostForComments?.display_username}
            </Typography>
            <Typography variant="body2" sx={{ color: '#cccccc', mt: 1 }}>
              {selectedPostForComments?.content}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseCommentsModal} sx={{ color: '#ffffff' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ backgroundColor: '#1a1a1a', p: 3 }}>
          {/* Add New Engagement Comment Form */}
          <Paper sx={{ backgroundColor: '#2a2a2a', p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
              Add Engagement Comment
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Username"
                value={newEngagementComment.username}
                onChange={(e) => setNewEngagementComment(prev => ({ ...prev, username: e.target.value }))}
                placeholder="e.g., Sarah, Emma, etc."
                sx={{
                  '& .MuiInputBase-root': {
                    color: '#ffffff',
                    backgroundColor: '#333333',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#cccccc',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#555555',
                  },
                }}
              />
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Comment Content"
                value={newEngagementComment.content}
                onChange={(e) => setNewEngagementComment(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your engagement comment here..."
                sx={{
                  '& .MuiInputBase-root': {
                    color: '#ffffff',
                    backgroundColor: '#333333',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#cccccc',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#555555',
                  },
                }}
              />
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl sx={{ width: '200px' }}>
                  <Typography variant="body2" sx={{ color: '#cccccc', mb: 1 }}>
                    Avatar Color
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {['#A9E5BB', '#FFB385', '#CBB3FF', '#B3E5FC'].map((color) => (
                      <Box
                        key={color}
                        onClick={() => setNewEngagementComment(prev => ({ ...prev, avatarColor: color }))}
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: color,
                          borderRadius: '50%',
                          cursor: 'pointer',
                          border: newEngagementComment.avatarColor === color ? '3px solid #ffffff' : '2px solid #555555',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            borderColor: '#ffffff',
                          },
                        }}
                      />
                    ))}
                  </Box>
                </FormControl>
                
                <TextField
                  label="Initial Like Count"
                  type="number"
                  value={newEngagementComment.likeCount}
                  onChange={(e) => setNewEngagementComment(prev => ({ ...prev, likeCount: parseInt(e.target.value) || 0 }))}
                  inputProps={{ min: 0 }}
                  sx={{
                    width: '180px',
                    '& .MuiInputBase-root': {
                      color: '#ffffff',
                      backgroundColor: '#333333',
                    },
                    '& .MuiInputLabel-root': {
                      color: '#cccccc',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#555555',
                    },
                  }}
                />
              </Box>
              
              <Button
                variant="contained"
                onClick={handleCreateEngagementComment}
                disabled={creatingEngagementComment || !newEngagementComment.content || !newEngagementComment.username}
                sx={{
                  backgroundColor: '#CBB3FF',
                  color: '#000000',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: '#A9E5BB',
                  },
                  '&:disabled': {
                    backgroundColor: '#666666',
                    color: '#999999',
                  },
                }}
              >
                {creatingEngagementComment ? 'Creating...' : 'Add Engagement Comment'}
              </Button>
            </Box>
          </Paper>
          
          {/* Existing Comments List */}
          <Paper sx={{ backgroundColor: '#2a2a2a', p: 3 }}>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
              All Comments ({postComments.length})
            </Typography>
            
            {postCommentsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#CBB3FF' }} />
              </Box>
            ) : postComments.length === 0 ? (
              <Typography variant="body1" sx={{ color: '#cccccc', textAlign: 'center', py: 4 }}>
                No comments on this post yet.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '400px', overflowY: 'auto' }}>
                {postComments.map((comment) => (
                  <Paper key={comment.id} sx={{ backgroundColor: '#333333', p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar
                            sx={{
                              bgcolor: comment.display_avatar_color || comment.avatar_color || '#CBB3FF',
                              width: 28,
                              height: 28,
                              mr: 2,
                              fontSize: '0.8rem'
                            }}
                          >
                            {(comment.display_username || comment.username || 'U').charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                color: comment.display_avatar_color || comment.avatar_color || '#ffffff', 
                                fontWeight: 'bold' 
                              }}
                            >
                              @{comment.display_username || comment.username || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#cccccc' }}>
                              {new Date(comment.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })} • {comment.like_count || 0} likes
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#ffffff', ml: 5 }}>
                          {comment.content}
                        </Typography>
                      </Box>
                      {comment.display_username && (
                        <IconButton
                          onClick={() => handleDeleteEngagementComment(comment.id)}
                          sx={{ 
                            color: '#ff4444',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 68, 68, 0.1)',
                            },
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </DialogContent>
      </Dialog>

      {/* New Comment Modal for Engagement Comments Tab */}
      <Dialog 
        open={commentModalOpen}
        onClose={handleCloseCommentModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            color: '#ffffff',
            minHeight: '600px'
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#2a2a2a', 
          color: '#ffffff', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #444444'
        }}>
          <Typography variant="h6">
            Comments for Post by @{selectedPostForCommenting?.display_username || selectedPostForCommenting?.username || 'Unknown'}
          </Typography>
          <IconButton onClick={handleCloseCommentModal} sx={{ color: '#ffffff' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ backgroundColor: '#1a1a1a', p: 3 }}>
          {/* Post Preview */}
          <Paper sx={{ backgroundColor: '#2a2a2a', p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
              Original Post
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  bgcolor: selectedPostForCommenting?.display_avatar_color || selectedPostForCommenting?.avatar_color || '#CBB3FF',
                  width: 40,
                  height: 40,
                  mr: 2,
                }}
              >
                {(selectedPostForCommenting?.display_username || selectedPostForCommenting?.username || 'U').charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: selectedPostForCommenting?.display_avatar_color || selectedPostForCommenting?.avatar_color || '#ffffff', 
                    fontWeight: 'bold' 
                  }}
                >
                  @{selectedPostForCommenting?.display_username || selectedPostForCommenting?.username || 'Unknown'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#cccccc' }}>
                  {selectedPostForCommenting && new Date(selectedPostForCommenting.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })} • {selectedPostForCommenting?.like_count || 0} likes
                </Typography>
              </Box>
            </Box>
            <Typography variant="body1" sx={{ color: '#ffffff', ml: 7 }}>
              {selectedPostForCommenting?.content}
            </Typography>
          </Paper>

          {/* Add New Comment Form */}
          <Paper sx={{ backgroundColor: '#2a2a2a', p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
              Add New Comment
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Username"
                value={newComment.username}
                onChange={(e) => setNewComment(prev => ({ ...prev, username: e.target.value }))}
                placeholder="e.g., CommunityBot"
                sx={{
                  '& .MuiInputBase-root': {
                    color: '#ffffff',
                    backgroundColor: '#333333',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#cccccc',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#555555',
                  },
                }}
              />
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Comment Content"
                value={newComment.content}
                onChange={(e) => setNewComment(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your comment here..."
                sx={{
                  '& .MuiInputBase-root': {
                    color: '#ffffff',
                    backgroundColor: '#333333',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#cccccc',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#555555',
                  },
                }}
              />
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl sx={{ width: '200px' }}>
                  <Typography variant="body2" sx={{ color: '#cccccc', mb: 1 }}>
                    Avatar Color
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {['#A9E5BB', '#FFB385', '#CBB3FF', '#B3E5FC'].map((color) => (
                      <Box
                        key={color}
                        onClick={() => setNewComment(prev => ({ ...prev, avatarColor: color }))}
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: color,
                          borderRadius: '50%',
                          cursor: 'pointer',
                          border: newComment.avatarColor === color ? '3px solid #ffffff' : '2px solid #555555',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            borderColor: '#ffffff',
                          },
                        }}
                      />
                    ))}
                  </Box>
                </FormControl>
                
                <TextField
                  label="Initial Like Count"
                  type="number"
                  value={newComment.likeCount}
                  onChange={(e) => setNewComment(prev => ({ ...prev, likeCount: parseInt(e.target.value) || 0 }))}
                  inputProps={{ min: 0 }}
                  sx={{
                    width: '180px',
                    '& .MuiInputBase-root': {
                      color: '#ffffff',
                      backgroundColor: '#333333',
                    },
                    '& .MuiInputLabel-root': {
                      color: '#cccccc',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#555555',
                    },
                  }}
                />
              </Box>
              
              <Button
                variant="contained"
                onClick={handleCreateComment}
                disabled={creatingComment || !newComment.content || !newComment.username}
                sx={{
                  backgroundColor: '#CBB3FF',
                  color: '#000000',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: '#A9E5BB',
                  },
                  '&:disabled': {
                    backgroundColor: '#666666',
                    color: '#999999',
                  },
                }}
              >
                {creatingComment ? 'Creating...' : 'Add Comment'}
              </Button>
            </Box>
          </Paper>
          
          {/* Existing Comments List */}
          <Paper sx={{ backgroundColor: '#2a2a2a', p: 3 }}>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
              All Comments ({postComments.length})
            </Typography>
            
            {postCommentsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#CBB3FF' }} />
              </Box>
            ) : postComments.length === 0 ? (
              <Typography variant="body1" sx={{ color: '#cccccc', textAlign: 'center', py: 4 }}>
                No comments on this post yet.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '400px', overflowY: 'auto' }}>
                {postComments.map((comment) => (
                  <Paper key={comment.id} sx={{ backgroundColor: '#333333', p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar
                            sx={{
                              bgcolor: comment.display_avatar_color || comment.avatar_color || '#CBB3FF',
                              width: 28,
                              height: 28,
                              mr: 2,
                              fontSize: '0.8rem'
                            }}
                          >
                            {(comment.display_username || comment.username || 'U').charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                color: comment.display_avatar_color || comment.avatar_color || '#ffffff', 
                                fontWeight: 'bold' 
                              }}
                            >
                              @{comment.display_username || comment.username || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#cccccc' }}>
                              {new Date(comment.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })} • {comment.like_count || 0} likes
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#ffffff', ml: 5 }}>
                          {comment.content}
                        </Typography>
                      </Box>
                      {comment.display_username && (
                        <IconButton
                          onClick={() => handleDeleteEngagementComment(comment.id)}
                          sx={{ 
                            color: '#ff4444',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 68, 68, 0.1)',
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </DialogContent>
      </Dialog>

    </Box>
  );
};

export default Dashboard; 