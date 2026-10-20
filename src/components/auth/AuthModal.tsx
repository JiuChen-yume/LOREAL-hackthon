import React from 'react';
import { LoginScreen } from './LoginScreen';
import { UserProfile } from '../../types/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  currentUser?: UserProfile | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="max-w-md w-full max-h-[92vh] overflow-y-auto rounded-3xl">
        <LoginScreen
          onLoginSuccess={(user) => {
            onLoginSuccess(user);
            onClose();
          }}
          onCancel={onClose}
          currentUser={currentUser}
          isModal={true}
        />
      </div>
    </div>
  );
};

