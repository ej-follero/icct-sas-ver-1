import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface EncryptionKey {
  id: string;
  key: Buffer;
  salt: Buffer;
  iterations: number;
  createdAt: Date;
  isActive: boolean;
}

export interface EncryptedFileInfo {
  originalName: string;
  encryptedName: string;
  algorithm: string;
  keyId: string;
  iv: Buffer;
  salt: Buffer;
  iterations: number;
  checksum: string;
}

export class EncryptionService {
  private static instance: EncryptionService;
  private keys: Map<string, EncryptionKey> = new Map();
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly saltLength = 16;
  private readonly iterations = 100000;

  private constructor() {
    this.initializeDefaultKey();
  }

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  // Initialize with a default key
  private async initializeDefaultKey() {
    const defaultKeyId = 'default-key';
    const defaultPassword = process.env.BACKUP_ENCRYPTION_PASSWORD || 'default-backup-password';
    
    const key = await this.generateKeyFromPassword(defaultPassword);
    const salt = crypto.randomBytes(this.saltLength);
    
    this.keys.set(defaultKeyId, {
      id: defaultKeyId,
      key,
      salt,
      iterations: this.iterations,
      createdAt: new Date(),
      isActive: true
    });
  }

  // Generate a key from a password using PBKDF2
  private async generateKeyFromPassword(password: string, salt?: Buffer): Promise<Buffer> {
    const usedSalt = salt || crypto.randomBytes(this.saltLength);
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, usedSalt, this.iterations, this.keyLength, 'sha256', (err, key) => {
        if (err) reject(err);
        else resolve(key);
      });
    });
  }

  // Generate a new encryption key
  async generateNewKey(keyId: string, password: string): Promise<EncryptionKey> {
    const salt = crypto.randomBytes(this.saltLength);
    const key = await this.generateKeyFromPassword(password, salt);
    
    const encryptionKey: EncryptionKey = {
      id: keyId,
      key,
      salt,
      iterations: this.iterations,
      createdAt: new Date(),
      isActive: true
    };

    this.keys.set(keyId, encryptionKey);
    return encryptionKey;
  }

  // Encrypt a file
  async encryptFile(
    inputPath: string, 
    outputPath: string, 
    keyId: string = 'default-key'
  ): Promise<EncryptedFileInfo> {
    const key = this.keys.get(keyId);
    if (!key || !key.isActive) {
      throw new Error(`Encryption key not found or inactive: ${keyId}`);
    }

    // Read the input file
    const fileBuffer = await fs.readFile(inputPath);
    const originalName = path.basename(inputPath);

    // Generate IV for this encryption
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipher(this.algorithm, key.key);
    cipher.setAAD(Buffer.from(originalName, 'utf8'));

    // Encrypt the file
    let encrypted = cipher.update(fileBuffer, undefined, 'base64');
    encrypted += cipher.final('base64');

    // Get the auth tag
    const authTag = cipher.getAuthTag();

    // Create metadata
    const metadata: EncryptedFileInfo = {
      originalName,
      encryptedName: path.basename(outputPath),
      algorithm: this.algorithm,
      keyId,
      iv,
      salt: key.salt,
      iterations: key.iterations,
      checksum: this.calculateChecksum(fileBuffer)
    };

    // Combine metadata, auth tag, and encrypted data
    const encryptedData = {
      metadata,
      authTag: authTag.toString('base64'),
      data: encrypted
    };

    // Write encrypted file
    await fs.writeFile(outputPath, JSON.stringify(encryptedData, null, 2));

    return metadata;
  }

  // Decrypt a file
  async decryptFile(
    inputPath: string, 
    outputPath: string, 
    keyId?: string
  ): Promise<string> {
    // Read the encrypted file
    const encryptedContent = await fs.readFile(inputPath, 'utf8');
    const encryptedData = JSON.parse(encryptedContent);

    const { metadata, authTag, data } = encryptedData;
    const actualKeyId = keyId || metadata.keyId;

    const key = this.keys.get(actualKeyId);
    if (!key || !key.isActive) {
      throw new Error(`Decryption key not found or inactive: ${actualKeyId}`);
    }

    // Create decipher
    const decipher = crypto.createDecipher(this.algorithm, key.key);
    decipher.setAAD(Buffer.from(metadata.originalName, 'utf8'));
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));

    // Decrypt the data
    let decrypted = decipher.update(data, 'base64');
    const finalBuffer = decipher.final();
    const decryptedBuffer = Buffer.concat([decrypted, finalBuffer]);

    // Verify checksum
    const calculatedChecksum = this.calculateChecksum(decryptedBuffer);
    if (calculatedChecksum !== metadata.checksum) {
      throw new Error('File integrity check failed - file may be corrupted');
    }

    // Write decrypted file
    await fs.writeFile(outputPath, decryptedBuffer);

    return metadata.originalName;
  }

  // Calculate file checksum
  private calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  // Verify file integrity without decrypting
  async verifyFileIntegrity(filePath: string, keyId?: string): Promise<boolean> {
    try {
      const encryptedContent = await fs.readFile(filePath, 'utf8');
      const encryptedData = JSON.parse(encryptedContent);
      const { metadata } = encryptedData;

      const actualKeyId = keyId || metadata.keyId;
      const key = this.keys.get(actualKeyId);

      if (!key || !key.isActive) {
        return false;
      }

      // Basic structure validation
      return !!(metadata && metadata.checksum && metadata.originalName);
    } catch (error) {
      return false;
    }
  }

  // Get all available keys
  getKeys(): EncryptionKey[] {
    return Array.from(this.keys.values());
  }

  // Deactivate a key
  deactivateKey(keyId: string): boolean {
    const key = this.keys.get(keyId);
    if (key) {
      key.isActive = false;
      return true;
    }
    return false;
  }

  // Reactivate a key
  reactivateKey(keyId: string): boolean {
    const key = this.keys.get(keyId);
    if (key) {
      key.isActive = true;
      return true;
    }
    return false;
  }

  // Check if encryption is available
  isEncryptionAvailable(): boolean {
    return this.keys.size > 0 && Array.from(this.keys.values()).some(key => key.isActive);
  }

  // Get encryption statistics
  getEncryptionStats() {
    const keys = this.getKeys();
    return {
      totalKeys: keys.length,
      activeKeys: keys.filter(k => k.isActive).length,
      inactiveKeys: keys.filter(k => !k.isActive).length,
      encryptionAvailable: this.isEncryptionAvailable()
    };
  }
}

export const encryptionService = EncryptionService.getInstance(); 