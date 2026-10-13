export function incomingSound() {
    let audio: AudioContext | null = null;
    const arm = () => {
        if (!('AudioContext' in window)) return;
        audio ??= new AudioContext();
        if (audio.state === 'suspended') void audio.resume().catch(() => {});
    };
    document.addEventListener('pointerdown', arm);
    document.addEventListener('keydown', arm);
    return {
        play() {
            if (!audio || audio.state !== 'running') return;
            const oscillator = audio.createOscillator();
            const gain = audio.createGain();
            const start = audio.currentTime;
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(660, start);
            oscillator.frequency.setValueAtTime(880, start + 0.09);
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.12, start + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.24);
            oscillator.connect(gain);
            gain.connect(audio.destination);
            oscillator.start(start);
            oscillator.stop(start + 0.25);
        },
        dispose() {
            document.removeEventListener('pointerdown', arm);
            document.removeEventListener('keydown', arm);
            if (audio) void audio.close().catch(() => {});
        },
    };
}
