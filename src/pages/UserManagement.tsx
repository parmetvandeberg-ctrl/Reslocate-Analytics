
import React, { useState, useEffect } from 'react'
import { Mail, Lock, Copy, AlertCircle, CheckCircle, RefreshCw, Users, Loader, UserPlus, Edit, Save, X, Plus, Trash2 } from 'lucide-react'
import { createUserWithEmail, generatePassword, getRecentUsers, copyToClipboard, updateUserProfile, getUserProfile, addEmailToAddedEmail, getAllAddedEmails } from '../lib/userService'
import { Profile } from '../types/database'
import { AddedEmail } from '../lib/userService'

interface UserData {
  id: string
  email: string
  created_at: string
}

interface CreateUserFormData {
  email: string
  first_name: string
  last_name: string
  phone_number: string
  role: 'Learner' | 'Parent' | 'Tutor' | 'Other'
}

export function UserManagement() {
  const [activeTab, setActiveTab] = useState<'create' | 'profiles' | 'addedEmails'>('create')
  
  // Create User Form States
  const [userFormData, setUserFormData] = useState<CreateUserFormData>({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'Learner'
  })
  const [passwordOption, setPasswordOption] = useState<'auto' | 'custom'>('auto')
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [customPassword, setCustomPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [copiedPassword, setCopiedPassword] = useState(false)
  
  // Profile Management States
  const [recentUsers, setRecentUsers] = useState<UserData[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [editingProfile, setEditingProfile] = useState<string | null>(null)
  const [editProfileData, setEditProfileData] = useState<Partial<Profile>>({})
  
  // AddedEmail Management States
  const [addedEmails, setAddedEmails] = useState<AddedEmail[]>([])
  const [loadingAddedEmails, setLoadingAddedEmails] = useState(false)
  const [addEmailForm, setAddEmailForm] = useState({
    email: '',
    first_name: '',
    last_name: ''
  })
  const [addingEmail, setAddingEmail] = useState(false)
  
  const [touched, setTouched] = useState({ 
    email: false, 
    customPassword: false,
    first_name: false,
    last_name: false 
  })
  const [submitted, setSubmitted] = useState(false)

  // Validation functions
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isValidPassword = (password: string) => password.length >= 6
  const isValidName = (name: string) => name.trim().length >= 2

  // Form validation
  const emailError = touched.email && !userFormData.email ? 'Email is required' : 
                     touched.email && !isValidEmail(userFormData.email) ? 'Invalid email format' : ''
  
  const firstNameError = touched.first_name && !userFormData.first_name ? 'First name is required' :
                        touched.first_name && !isValidName(userFormData.first_name) ? 'First name must be at least 2 characters' : ''

  const lastNameError = touched.last_name && !userFormData.last_name ? 'Last name is required' :
                       touched.last_name && !isValidName(userFormData.last_name) ? 'Last name must be at least 2 characters' : ''
  
  const customPasswordError = touched.customPassword && !customPassword ? 'Password is required' : 
                              touched.customPassword && !isValidPassword(customPassword) ? 
                              'Password must be at least 6 characters' : ''

  const canSubmit = userFormData.email && isValidEmail(userFormData.email) && 
                   userFormData.first_name && isValidName(userFormData.first_name) &&
                   userFormData.last_name && isValidName(userFormData.last_name) &&
                   (passwordOption === 'auto' || (customPassword && isValidPassword(customPassword)))

  // Initialize generated password and fetch recent users
  useEffect(() => {
    handleGeneratePassword()
    fetchRecentUsers()
    
    if (activeTab === 'profiles') {
      fetchProfiles()
    } else if (activeTab === 'addedEmails') {
      fetchAddedEmails()
    }
  }, [activeTab])

  const fetchRecentUsers = async () => {
    try {
      const users = await getRecentUsers()
      setRecentUsers(users)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchProfiles = async () => {
    setLoadingProfiles(true)
    try {
      const profilesData = await getUserProfile()
      setProfiles(profilesData || [])
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoadingProfiles(false)
    }
  }

  const handleGeneratePassword = () => {
    const newPassword = generatePassword()
    setGeneratedPassword(newPassword)
    setCopiedPassword(false)
  }

  const handleCopyPassword = async () => {
    const success = await copyToClipboard(generatedPassword)
    if (success) {
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    }
  }

  const handleFieldBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const clearForm = () => {
    setUserFormData({
      email: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      role: 'Learner'
    })
    setGeneratedPassword('')
    setCustomPassword('')
    setTouched({ email: false, customPassword: false, first_name: false, last_name: false })
    setSubmitted(false)
    setPasswordOption('auto')
    handleGeneratePassword()
  }

  const handleInputChange = (field: keyof CreateUserFormData, value: string) => {
    setUserFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTouched({ 
      email: true, 
      first_name: true, 
      last_name: true,
      customPassword: passwordOption === 'custom' 
    })

    if (!canSubmit) return

    setLoading(true)
    setMessage(null)

    try {
      const passwordToUse = passwordOption === 'auto' ? generatedPassword : customPassword
      const response = await createUserWithEmail(userFormData.email, passwordToUse, userFormData)

      if (response.error) {
        throw response.error
      }

      setMessage({
        text: `User ${userFormData.email} created successfully! The user can now log in with their email and chosen password.`,
        type: 'success'
      })

      // Refresh recent users list
      await fetchRecentUsers()
      
      // Reset form after successful creation
      setTimeout(() => {
        clearForm()
      }, 2000)

    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'Failed to create user',
        type: 'error'
      })
    } finally {
      setLoading(false)
      setSubmitted(false)
    }
  }

  const handleEditProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId)
    if (profile) {
      setEditingProfile(profileId)
      setEditProfileData({ ...profile })
    }
  }

  const handleSaveProfile = async (profileId: string) => {
    try {
      await updateUserProfile(profileId, editProfileData)
      setProfiles(prev => prev.map(p => 
        p.id === profileId ? { ...p, ...editProfileData } : p
      ))
      setEditingProfile(null)
      setEditProfileData({})
      setMessage({
        text: 'Profile updated successfully!',
        type: 'success'
      })
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'Failed to update profile',
        type: 'error'
      })
    }
  }

  const fetchAddedEmails = async () => {
    setLoadingAddedEmails(true)
    try {
      const emailsData = await getAllAddedEmails()
      setAddedEmails(emailsData || [])
    } catch (error) {
      console.error('Error fetching added emails:', error)
    } finally {
      setLoadingAddedEmails(false)
    }
  }

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingEmail(true)
    
    try {
      const result = await addEmailToAddedEmail(
        addEmailForm.email,
        addEmailForm.first_name,
        addEmailForm.last_name
      )
      
      if (result.success) {
        setMessage({
          text: `Email ${addEmailForm.email} added successfully to AddedEmail table!`,
          type: 'success'
        })
        setAddEmailForm({ email: '', first_name: '', last_name: '' })
        await fetchAddedEmails()
      } else {
        setMessage({
          text: result.error || 'Failed to add email to AddedEmail table',
          type: 'error'
        })
      }
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'Failed to add email',
        type: 'error'
      })
    } finally {
      setAddingEmail(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingProfile(null)
    setEditProfileData({})
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Create and manage user accounts and profiles</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <Users className="w-5 h-5" />
              <span>{recentUsers.length} recent users</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <UserPlus className="w-4 h-4" />
                <span>Create User</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('profiles')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profiles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Manage Profiles</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('addedEmails')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'addedEmails'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Added Emails</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create User Form */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New User</h2>

          {/* Message Display */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={() => handleFieldBlur('email')}
                  placeholder="user@example.com"
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    emailError ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="first_name"
                  type="text"
                  value={userFormData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  onBlur={() => handleFieldBlur('first_name')}
                  placeholder="John"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    firstNameError ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {firstNameError && (
                  <p className="mt-1 text-sm text-red-600">{firstNameError}</p>
                )}
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="last_name"
                  type="text"
                  value={userFormData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  onBlur={() => handleFieldBlur('last_name')}
                  placeholder="Doe"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    lastNameError ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {lastNameError && (
                  <p className="mt-1 text-sm text-red-600">{lastNameError}</p>
                )}
              </div>
            </div>

            {/* Phone and Role Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone_number"
                  type="tel"
                  value={userFormData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  id="role"
                  value={userFormData.role}
                  onChange={(e) => handleInputChange('role', e.target.value as 'Learner' | 'Parent' | 'Tutor' | 'Other')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Learner">Learner</option>
                  <option value="Parent">Parent</option>
                  <option value="Tutor">Tutor</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Password Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Password Options
              </label>
              
              {/* Auto-generate option */}
              <div className="mb-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="passwordOption"
                    value="auto"
                    checked={passwordOption === 'auto'}
                    onChange={() => {
                      setPasswordOption('auto')
                      if (!generatedPassword) {
                        handleGeneratePassword()
                      }
                    }}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="text-gray-900 font-medium">Auto-generate password</span>
                    <p className="text-gray-600 text-sm mt-1">Create a secure random password</p>
                    
                    {passwordOption === 'auto' && generatedPassword && (
                      <div className="mt-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 bg-gray-50 border border-gray-300 rounded px-3 py-2 font-mono text-sm">
                            {generatedPassword}
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyPassword}
                            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                          >
                            <Copy className="w-4 h-4" />
                            <span>{copiedPassword ? 'Copied!' : 'Copy'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleGeneratePassword}
                            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span>Regenerate</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              </div>
              {/* Custom password option */}
              <div className="mb-0">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="passwordOption"
                    value="custom"
                    checked={passwordOption === 'custom'}
                    onChange={() => setPasswordOption('custom')}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="text-gray-900 font-medium">Custom password</span>
                    <p className="text-gray-600 text-sm mt-1">Set your own password</p>
                    
                    {passwordOption === 'custom' && (
                      <div className="mt-3">
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <input
                            type="password"
                            value={customPassword}
                            onChange={(e) => setCustomPassword(e.target.value)}
                            onBlur={() => handleFieldBlur('customPassword')}
                            placeholder="Enter password"
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              customPasswordError ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                        </div>
                        {customPasswordError && (
                          <p className="mt-1 text-sm text-red-600">{customPasswordError}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Minimum 6 characters
                        </p>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Creating User...</span>
                  </>
                ) : (
                  <span>Add User</span>
                )}
              </button>
              {submitted && !canSubmit && (
                <p className="mt-2 text-sm text-red-600 text-center">
                  Please fix the form errors before submitting
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Recent Users Sidebar */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recently Created Users</h2>
          
          {recentUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No users created yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900 truncate">{user.email}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Created {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </>
      ) : activeTab === 'profiles' ? (
        /* Profile Management Tab */
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Management</h2>
          
          {loadingProfiles ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading profiles...</span>
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No profiles found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {profiles.map((profile) => (
                <div key={profile.id} className="border border-gray-200 rounded-lg p-4">
                  {editingProfile === profile.id ? (
                    /* Edit Mode */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Edit Profile</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSaveProfile(profile.id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            <Save className="w-4 h-4" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={editProfileData.email || ''}
                            onChange={(e) => setEditProfileData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <select
                            value={editProfileData.role || profile.role}
                            onChange={(e) => setEditProfileData(prev => ({ ...prev, role: e.target.value as 'Learner' | 'Parent' | 'Tutor' | 'Other' }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="Learner">Learner</option>
                            <option value="Parent">Parent</option>
                            <option value="Tutor">Tutor</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                          <input
                            type="text"
                            value={editProfileData.first_name || ''}
                            onChange={(e) => setEditProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                          <input
                            type="text"
                            value={editProfileData.last_name || ''}
                            onChange={(e) => setEditProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                          <input
                            type="tel"
                            value={editProfileData.phone_number || ''}
                            onChange={(e) => setEditProfileData(prev => ({ ...prev, phone_number: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                          <input
                            type="text"
                            value={editProfileData.school || ''}
                            onChange={(e) => setEditProfileData(prev => ({ ...prev, school: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {profile.first_name?.[0] || profile.email?.[0] || 'U'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {profile.first_name && profile.last_name 
                                ? `${profile.first_name} ${profile.last_name}`
                                : profile.email || 'No name'}
                            </h3>
                            <p className="text-sm text-gray-600">{profile.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleEditProfile(profile.id)}
                          className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Role:</span>
                          <span className="ml-1 text-gray-600">{profile.role}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Phone:</span>
                          <span className="ml-1 text-gray-600">{profile.phone_number || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">School:</span>
                          <span className="ml-1 text-gray-600">{profile.school || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Created:</span>
                          <span className="ml-1 text-gray-600">
                            {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Added Emails Tab */
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Added Emails Management</h2>
            <div className="flex items-center space-x-2 text-gray-600">
              <Mail className="w-5 h-5" />
              <span>{addedEmails.length} emails tracked</span>
            </div>
          </div>
          
          {/* Message Display */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{message.text}</p>
            </div>
          )} 

          {/* Add Email Form */}
          <div className="mb-8 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Email</h3>
            <form onSubmit={handleAddEmail} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="add-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="add-email"
                  type="email"
                  value={addEmailForm.email}
                  onChange={(e) => setAddEmailForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="add-first-name" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  id="add-first-name"
                  type="text"
                  value={addEmailForm.first_name}
                  onChange={(e) => setAddEmailForm(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="John"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="add-last-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  id="add-last-name"
                  type="text"
                  value={addEmailForm.last_name}
                  onChange={(e) => setAddEmailForm(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-3">
                <button
                  type="submit"
                  disabled={addingEmail || !addEmailForm.email}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center space-x-2"
                >
                  {addingEmail ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Adding Email...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add Email</span>
                    </>
                  )}
                </button>
                {!addEmailForm.email && (
                  <p className="mt-2 text-sm text-gray-500">
                    Enter an email address to add to the tracking system
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* Email List */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tracked Emails</h3>
            
            {loadingAddedEmails ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading emails...</span>
              </div>
            ) : addedEmails.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <Mail className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No emails tracked yet</h4>
                <p className="text-gray-500 mb-4">Add emails above to start tracking contacts</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
                    <div>Email</div>
                    <div>First Name</div>
                    <div>Last Name</div>
                    <div>Added By</div>
                    <div>Date Added</div>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {addedEmails.map((addedEmail) => (
                    <div key={addedEmail.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-5 gap-4 text-sm text-gray-700">
                        <div className="font-medium truncate" title={addedEmail.email}>
                          {addedEmail.email}
                        </div>
                        <div className="truncate" title={addedEmail.first_name || 'N/A'}>
                          {addedEmail.first_name || 'N/A'}
                        </div>
                        <div className="truncate" title={addedEmail.last_name || 'N/A'}>
                          {addedEmail.last_name || 'N/A'}
                        </div>
                        <div className="font-mono text-xs text-gray-500 truncate">
                          {addedEmail.created_by || 'System'}
                        </div>
                        <div className="text-gray-500">
                          {addedEmail.created_at ? new Date(addedEmail.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}