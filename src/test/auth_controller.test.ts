// src/test/auth_controller.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleRegisterSpeech, RegistrationSession } from '../auth/authController';
import { RegisterStep } from '../auth/authTypes';

describe('Auth Controller Speech Logic (SP1)', () => {
    let session: RegistrationSession;
    let currentStep: RegisterStep;
    const speak = vi.fn();
    const setSession = (updater: any) => {
        if (typeof updater === 'function') {
            session = updater(session);
        } else {
            session = updater;
        }
    };
    const setStep = (step: RegisterStep) => {
        currentStep = step;
    };

    beforeEach(() => {
        session = { email: '' }; // Start with basic email session
        currentStep = 'EMAIL';
        vi.clearAllMocks();
    });

    it('should capture EMAIL and transition to CONFIRM_EMAIL, then advance to PASSWORD on confirmation', () => {
        handleRegisterSpeech('test@example.com', session, setSession, 'EMAIL', setStep, speak);
        expect(session.email).toBe('test@example.com');
        expect(currentStep).toBe('CONFIRM_EMAIL');
        expect(speak).toHaveBeenCalledWith(expect.stringContaining('Email set to test@example.com'));

        handleRegisterSpeech('yes', session, setSession, 'CONFIRM_EMAIL', setStep, speak);
        expect(currentStep).toBe('PASSWORD');
    });

    it('should capture PASSWORD and transition to CONFIRM_PASSWORD, then advance to FACE on confirmation', () => {
        currentStep = 'PASSWORD';
        handleRegisterSpeech('mypassword123', session, setSession, 'PASSWORD', setStep, speak);
        expect(session.password).toBe('mypassword123');
        expect(currentStep).toBe('CONFIRM_PASSWORD');
        expect(speak).toHaveBeenCalledWith(expect.stringContaining('I captured your password'));

        handleRegisterSpeech('yes', session, setSession, 'CONFIRM_PASSWORD', setStep, speak);
        expect(currentStep).toBe('FACE');
    });

    it('should capture VOICE_PIN and transition to CONFIRM_VOICE_PIN, then advance to COMPLETE on confirmation', () => {
        currentStep = 'VOICE_PIN';
        handleRegisterSpeech('1 2 3 4', session, setSession, 'VOICE_PIN', setStep, speak);
        expect(session.voicePin).toBe('1234');
        expect(currentStep).toBe('CONFIRM_VOICE_PIN');

        handleRegisterSpeech('yes', session, setSession, 'CONFIRM_VOICE_PIN', setStep, speak);
        expect(currentStep).toBe('COMPLETE');
    });

    it('should reject email and return to EMAIL step when user says "not correct" or "incorrect"', () => {
        currentStep = 'CONFIRM_EMAIL';
        handleRegisterSpeech('not correct', session, setSession, 'CONFIRM_EMAIL', setStep, speak);
        expect(currentStep).toBe('EMAIL');
        expect(speak).toHaveBeenCalledWith(expect.stringContaining('Please say your email address again'));
    });

    it('should reject password and return to PASSWORD step when user says "I said it\'s incorrect"', () => {
        currentStep = 'CONFIRM_PASSWORD';
        handleRegisterSpeech("I said it's incorrect", session, setSession, 'CONFIRM_PASSWORD', setStep, speak);
        expect(currentStep).toBe('PASSWORD');
        expect(speak).toHaveBeenCalledWith(expect.stringContaining('Please say your password again'));
    });
});
