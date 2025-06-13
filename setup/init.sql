-- Reset tables
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS contractors;

-- Create contractors table
CREATE TABLE contractors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  parking_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create payments table
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID NOT NULL REFERENCES contractors(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  stripe_payment_intent_id TEXT,
  UNIQUE(contractor_id, year, month)
);

-- Create indexes
CREATE INDEX idx_contractors_name ON contractors(name);
CREATE INDEX idx_payments_contractor_id ON payments(contractor_id);
CREATE INDEX idx_payments_year_month ON payments(year, month);

-- Insert sample contractors
INSERT INTO contractors (name, parking_number) VALUES
  ('山田太郎', 'A-001'),
  ('鈴木一郎', 'A-002'),
  ('佐藤花子', 'B-001')
ON CONFLICT (name) DO NOTHING;

-- Insert sample payment history
DO $$
DECLARE
  yamada_id UUID;
  suzuki_id UUID;
  sato_id UUID;
  payment_date DATE;
BEGIN
  -- Get contractor IDs
  SELECT id INTO yamada_id FROM contractors WHERE name = '山田太郎';
  SELECT id INTO suzuki_id FROM contractors WHERE name = '鈴木一郎';
  SELECT id INTO sato_id FROM contractors WHERE name = '佐藤花子';

  -- 山田太郎: 2ヶ月前まで支払い済み
  FOR i IN 3..12 LOOP
    payment_date := CURRENT_DATE - (i || ' months')::INTERVAL;
    INSERT INTO payments (
      contractor_id,
      year,
      month,
      amount,
      paid_at
    ) VALUES (
      yamada_id,
      EXTRACT(YEAR FROM payment_date),
      EXTRACT(MONTH FROM payment_date),
      3500,
      payment_date + '15 days'::INTERVAL
    )
    ON CONFLICT (contractor_id, year, month) DO NOTHING;
  END LOOP;

  -- 鈴木一郎: 先月まで支払い済み
  FOR i IN 1..12 LOOP
    payment_date := CURRENT_DATE - (i || ' months')::INTERVAL;
    INSERT INTO payments (
      contractor_id,
      year,
      month,
      amount,
      paid_at
    ) VALUES (
      suzuki_id,
      EXTRACT(YEAR FROM payment_date),
      EXTRACT(MONTH FROM payment_date),
      3500,
      payment_date + '15 days'::INTERVAL
    )
    ON CONFLICT (contractor_id, year, month) DO NOTHING;
  END LOOP;

  -- 佐藤花子: 4ヶ月前まで支払い済みだが、履歴に空きあり（2ヶ月おき）
  FOR i IN 5..12 BY 2 LOOP
    payment_date := CURRENT_DATE - (i || ' months')::INTERVAL;
    INSERT INTO payments (
      contractor_id,
      year,
      month,
      amount,
      paid_at
    ) VALUES (
      sato_id,
      EXTRACT(YEAR FROM payment_date),
      EXTRACT(MONTH FROM payment_date),
      3500,
      payment_date + '15 days'::INTERVAL
    )
    ON CONFLICT (contractor_id, year, month) DO NOTHING;
  END LOOP;
END $$;
