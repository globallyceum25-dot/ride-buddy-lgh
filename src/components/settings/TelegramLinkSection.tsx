import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, RefreshCw, Unlink, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function TelegramLinkSection() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [isLinked, setIsLinked] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('telegram_chat_id, telegram_link_code')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setIsLinked(!!data.telegram_chat_id);
      setLinkCode(data.telegram_link_code);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const generateCode = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { error } = await supabase
        .from('profiles')
        .update({ telegram_link_code: code } as any)
        .eq('user_id', user.id);

      if (error) throw error;
      setLinkCode(code);
      toast({ title: 'Code Generated', description: 'Send this code to the Telegram bot.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const unlinkTelegram = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ telegram_chat_id: null, telegram_link_code: null } as any)
        .eq('user_id', user.id);

      if (error) throw error;
      setIsLinked(false);
      setLinkCode(null);
      toast({ title: 'Unlinked', description: 'Telegram account has been unlinked.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (linkCode) {
      navigator.clipboard.writeText(`/start ${linkCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <CardTitle className="text-lg">Telegram Notifications</CardTitle>
          {isLinked && (
            <Badge variant="default" className="ml-auto">Linked</Badge>
          )}
        </div>
        <CardDescription>
          Link your Telegram account to receive travel request notifications directly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLinked ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your Telegram account is linked. You'll receive notifications for closed and rescheduled requests.
            </p>
            <Button variant="outline" size="sm" onClick={unlinkTelegram} disabled={loading}>
              <Unlink className="h-4 w-4 mr-2" />
              Unlink Telegram
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              To link your Telegram account:
            </p>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
              <li>Generate a linking code below</li>
              <li>Open the bot in Telegram</li>
              <li>Send <code className="bg-muted px-1 rounded">/start CODE</code> to the bot</li>
            </ol>

            {linkCode ? (
              <div className="flex items-center gap-2">
                <code className="bg-muted px-3 py-2 rounded text-sm font-mono">
                  /start {linkCode}
                </code>
                <Button variant="ghost" size="icon" onClick={copyCode}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={generateCode} disabled={loading}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={generateCode} disabled={loading} size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                Generate Linking Code
              </Button>
            )}

            <Button
              variant="link"
              size="sm"
              className="px-0"
              onClick={() => fetchStatus()}
            >
              Refresh link status
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
