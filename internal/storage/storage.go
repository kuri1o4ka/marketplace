package storage

import (
	"context"
	"io"
	"strings"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type Storage struct {
	client   *minio.Client
	bucket   string
	publicUI string
}

func New(endpoint, accessKey, secretKey, bucket, publicURL string, secure bool) (*Storage, error) {
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: secure,
	})
	if err != nil {
		return nil, err
	}
	return &Storage{
		client:   client,
		bucket:   bucket,
		publicUI: strings.TrimRight(publicURL, "/"),
	}, nil
}

func (s *Storage) EnsureBucket(ctx context.Context) error {
	exists, err := s.client.BucketExists(ctx, s.bucket)
	if err != nil {
		return err
	}
	if exists {
		return nil
	}
	return s.client.MakeBucket(ctx, s.bucket, minio.MakeBucketOptions{})
}

func (s *Storage) Put(ctx context.Context, key string, r io.Reader, size int64, contentType string) error {
	_, err := s.client.PutObject(ctx, s.bucket, key, r, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	return err
}

func (s *Storage) URL(key string) string {
	return s.publicUI + "/" + strings.TrimLeft(key, "/")
}

// SetPublicRead allows anonymous GET on the bucket so the browser can render
// uploaded images directly. It is intentionally scoped to reads only.
func (s *Storage) SetPublicRead(ctx context.Context) error {
	policy := `{
		"Version": "2012-10-17",
		"Statement": [{
			"Effect": "Allow",
			"Principal": {"AWS": ["*"]},
			"Action": ["s3:GetObject"],
			"Resource": ["arn:aws:s3:::` + s.bucket + `/*"]
		}]
	}`
	return s.client.SetBucketPolicy(ctx, s.bucket, policy)
}
