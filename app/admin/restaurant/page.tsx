'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, RefreshCw, Coffee, Clock, MapPin, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/app/components/ui/textarea';
import { Switch } from '@/app/components/ui/switch';


interface OpeningHoursType {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
}

interface StoreSettings {
    id: string;
    storeName: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    logoUrl: string | null;
    openingHours: OpeningHoursType | null;
    taxRate: number;
    currencySymbol: string;
    createdAt: string;
    updatedAt: string;
}

const defaultOpeningHours: OpeningHoursType = {
    monday: { open: '08:00', close: '18:00', closed: false },
    tuesday: { open: '08:00', close: '18:00', closed: false },
    wednesday: { open: '08:00', close: '18:00', closed: false },
    thursday: { open: '08:00', close: '18:00', closed: false },
    friday: { open: '08:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '17:00', closed: false },
    sunday: { open: '00:00', close: '00:00', closed: true },
};

export default function CafeSettingsPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<StoreSettings | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [openingHours, setOpeningHours] = useState<OpeningHoursType>(defaultOpeningHours);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/restaurant-settings');
            if (!response.ok) {
                throw new Error('Failed to fetch settings');
            }
            const data = await response.json();
            setSettings(data);

            // Initialize opening hours from data or use defaults
            if (data.openingHours) {
                setOpeningHours(data.openingHours);
            }

            // Set logo preview if exists
            if (data.logoUrl) {
                setLogoPreview(data.logoUrl);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            toast({
                title: 'Error',
                description: 'Failed to load cafe settings.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onload = (event) => {
                setLogoPreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleOpeningHoursChange = (
        day: keyof OpeningHoursType,
        field: 'open' | 'close' | 'closed',
        value: string | boolean
    ) => {
        setOpeningHours((prev) => ({
            ...prev,
            [day]: {
                ...prev[day],
                [field]: value,
            },
        }));
    };

    const handleSettingsChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setSettings((prev) => prev ? { ...prev, [name]: value } : null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        try {
            setSaving(true);

            // Create form data to handle file upload
            const formData = new FormData();
            formData.append('storeName', settings.storeName);
            formData.append('address', settings.address || '');
            formData.append('phone', settings.phone || '');
            formData.append('email', settings.email || '');
            formData.append('taxRate', settings.taxRate.toString());
            formData.append('currencySymbol', settings.currencySymbol);
            formData.append('openingHours', JSON.stringify(openingHours));

            if (logoFile) {
                formData.append('logo', logoFile);
            }

            // Determine if we need to create or update settings
            const method = settings.id ? 'PUT' : 'POST';
            const response = await fetch('/api/restaurant-settings', {
                method,
                body: formData,
                headers: {
                    Accept: 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save settings');
            }

            const updatedSettings = await response.json();
            setSettings(updatedSettings);

            toast({
                title: 'Success',
                description: 'Cafe settings saved successfully.',
            });
        } catch (error) {
            console.error('Error saving settings:', error);
            toast({
                title: 'Error',
                description: 'Failed to save cafe settings.',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const resetSettings = async () => {
        if (!confirm('Are you sure you want to reset settings to defaults?')) {
            return;
        }

        try {
            setSaving(true);
            const response = await fetch('/api/restaurant-settings', {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to reset settings');
            }

            await fetchSettings();

            toast({
                title: 'Success',
                description: 'Cafe settings reset to defaults.',
            });
        } catch (error) {
            console.error('Error resetting settings:', error);
            toast({
                title: 'Error',
                description: 'Failed to reset cafe settings.',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-amber-50">
                <Coffee className="h-16 w-16 text-amber-700 animate-pulse mb-4" />
                <Loader2 className="h-8 w-8 animate-spin text-amber-600 mb-2" />
                <span className="text-lg text-amber-800">Brewing settings...</span>
            </div>
        );
    }

    return (
        <div className="bg-amber-50 min-h-screen">
            <div className="container mx-auto py-8 px-4 md:px-6">
                <div className="flex items-center justify-between mb-8 border-b border-amber-200 pb-4">
                    <div className="flex items-center gap-3">
                        <Coffee className="h-8 w-8 text-amber-700" />
                        <h1 className="text-3xl font-bold text-amber-900">Project 1.0</h1>
                    </div>
                    <div className="text-sm text-amber-700">Cafe Administration</div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-2xl font-bold text-amber-800 mb-4">Cafe Settings</h2>
                    <p className="text-amber-600 mb-6">Configure your cafe&apos;s profile and operational settings</p>

                    <form onSubmit={handleSubmit}>
                        <Tabs defaultValue="general" className="w-full">
                            <TabsList className="mb-6 bg-amber-100 p-1 rounded-lg">
                                <TabsTrigger value="general" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                                    <Coffee className="mr-2 h-4 w-4" />
                                    General
                                </TabsTrigger>
                                <TabsTrigger value="contact" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Contact
                                </TabsTrigger>
                                <TabsTrigger value="hours" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                                    <Clock className="mr-2 h-4 w-4" />
                                    Hours
                                </TabsTrigger>
                                <TabsTrigger value="appearance" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <path d="M12 2a5 5 0 0 0 0 10"></path>
                                    </svg>
                                    Branding
                                </TabsTrigger>
                            </TabsList>

                            {/* General Settings */}
                            <TabsContent value="general" className="bg-white rounded-lg p-4">
                                <Card className="border-amber-200 shadow-md">
                                    <CardHeader className="bg-amber-50 rounded-t-lg">
                                        <CardTitle className="text-amber-800">General Information</CardTitle>
                                        <CardDescription>Basic details for your cafe</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6 pt-6">
                                        <div className="grid gap-3">
                                            <Label htmlFor="storeName" className="text-amber-700">Cafe Name *</Label>
                                            <Input
                                                id="storeName"
                                                name="storeName"
                                                value={settings?.storeName || ''}
                                                onChange={handleSettingsChange}
                                                required
                                                className="border-amber-200 focus:ring-amber-500"
                                                placeholder="Project 1.0"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="grid gap-3">
                                                <Label htmlFor="currencySymbol" className="text-amber-700">Currency Symbol</Label>
                                                <Input
                                                    id="currencySymbol"
                                                    name="currencySymbol"
                                                    value={settings?.currencySymbol || '$'}
                                                    onChange={handleSettingsChange}
                                                    maxLength={3}
                                                    className="border-amber-200 focus:ring-amber-500"
                                                />
                                                <p className="text-sm text-amber-600">Used for displaying prices on menus and receipts</p>
                                            </div>

                                            <div className="grid gap-3">
                                                <Label htmlFor="taxRate" className="text-amber-700">Tax Rate (%)</Label>
                                                <Input
                                                    id="taxRate"
                                                    name="taxRate"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="100"
                                                    value={settings?.taxRate || 0}
                                                    onChange={handleSettingsChange}
                                                    className="border-amber-200 focus:ring-amber-500"
                                                />
                                                <p className="text-sm text-amber-600">Applied to all items automatically</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Contact Information */}
                            <TabsContent value="contact" className="bg-white rounded-lg p-4">
                                <Card className="border-amber-200 shadow-md">
                                    <CardHeader className="bg-amber-50 rounded-t-lg">
                                        <CardTitle className="text-amber-800">Contact Information</CardTitle>
                                        <CardDescription>How customers can reach your cafe</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6 pt-6">
                                        <div className="grid gap-3">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-5 w-5 text-amber-600" />
                                                <Label htmlFor="address" className="text-amber-700">Address</Label>
                                            </div>
                                            <Textarea
                                                id="address"
                                                name="address"
                                                value={settings?.address || ''}
                                                onChange={handleSettingsChange}
                                                rows={3}
                                                className="border-amber-200 focus:ring-amber-500"
                                                placeholder="123 Coffee Street, Brewville"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="grid gap-3">
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-5 w-5 text-amber-600" />
                                                    <Label htmlFor="phone" className="text-amber-700">Phone Number</Label>
                                                </div>
                                                <Input
                                                    id="phone"
                                                    name="phone"
                                                    value={settings?.phone || ''}
                                                    onChange={handleSettingsChange}
                                                    className="border-amber-200 focus:ring-amber-500"
                                                    placeholder="(555) 123-4567"
                                                />
                                            </div>

                                            <div className="grid gap-3">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-5 w-5 text-amber-600" />
                                                    <Label htmlFor="email" className="text-amber-700">Email</Label>
                                                </div>
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    value={settings?.email || ''}
                                                    onChange={handleSettingsChange}
                                                    className="border-amber-200 focus:ring-amber-500"
                                                    placeholder="hello@project1cafe.com"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Opening Hours */}
                            <TabsContent value="hours" className="bg-white rounded-lg p-4">
                                <Card className="border-amber-200 shadow-md">
                                    <CardHeader className="bg-amber-50 rounded-t-lg">
                                        <CardTitle className="text-amber-800">Opening Hours</CardTitle>
                                        <CardDescription>Set when your cafe is open to customers</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="space-y-6">
                                            {Object.keys(openingHours).map((day) => {
                                                const dayKey = day as keyof OpeningHoursType;
                                                const dayData = openingHours[dayKey];
                                                return (
                                                    <div key={day} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-3 rounded-lg hover:bg-amber-50 transition-colors">
                                                        <div className="md:col-span-2 font-medium text-amber-800 capitalize flex items-center">
                                                            <div className={`w-2 h-2 rounded-full mr-2 ${dayData.closed ? 'bg-red-400' : 'bg-green-400'}`}></div>
                                                            {day}
                                                        </div>

                                                        <div className="md:col-span-7 flex flex-col sm:flex-row items-center gap-2">
                                                            <Input
                                                                type="time"
                                                                value={dayData.open}
                                                                onChange={(e) => handleOpeningHoursChange(dayKey, 'open', e.target.value)}
                                                                disabled={dayData.closed}
                                                                className="border-amber-200 focus:ring-amber-500"
                                                            />
                                                            <span className="text-amber-700">to</span>
                                                            <Input
                                                                type="time"
                                                                value={dayData.close}
                                                                onChange={(e) => handleOpeningHoursChange(dayKey, 'close', e.target.value)}
                                                                disabled={dayData.closed}
                                                                className="border-amber-200 focus:ring-amber-500"
                                                            />
                                                        </div>

                                                        <div className="md:col-span-3 flex items-center justify-end gap-2">
                                                            <Label htmlFor={`closed-${day}`} className="cursor-pointer text-amber-700">
                                                                {dayData.closed ? "Closed" : "Open"}
                                                            </Label>
                                                            <Switch
                                                                id={`closed-${day}`}
                                                                checked={!dayData.closed}
                                                                onCheckedChange={(checked) => handleOpeningHoursChange(dayKey, 'closed', !checked)}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Appearance */}
                            <TabsContent value="appearance" className="bg-white rounded-lg p-4">
                                <Card className="border-amber-200 shadow-md">
                                    <CardHeader className="bg-amber-50 rounded-t-lg">
                                        <CardTitle className="text-amber-800">Cafe Branding</CardTitle>
                                        <CardDescription>Logo and visual identity</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6 pt-6">
                                        <div className="grid gap-3">
                                            <Label htmlFor="logo" className="text-amber-700">Cafe Logo</Label>
                                            <div className="border-2 border-dashed border-amber-200 rounded-lg p-6 text-center">
                                                <Input
                                                    id="logo"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoChange}
                                                    className="hidden"
                                                />

                                                {logoPreview ? (
                                                    <div className="flex flex-col items-center">
                                                        <div className="relative h-40 w-40 mb-4 border rounded-lg overflow-hidden bg-white shadow-md">
                                                            <img
                                                                src={logoPreview}
                                                                alt="Logo preview"
                                                                className="object-contain w-full h-full"
                                                            />
                                                        </div>
                                                        <Label htmlFor="logo" className="cursor-pointer px-4 py-2 bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200 transition-colors">
                                                            Change Logo
                                                        </Label>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <div className="mb-4 h-40 w-40 flex items-center justify-center border rounded-lg bg-amber-50">
                                                            <Coffee className="h-16 w-16 text-amber-300" />
                                                        </div>
                                                        <Label htmlFor="logo" className="cursor-pointer px-4 py-2 bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200 transition-colors">
                                                            Upload Logo
                                                        </Label>
                                                    </div>
                                                )}

                                                <p className="mt-4 text-sm text-amber-600">
                                                    Recommended: PNG or JPG, at least 400x400px
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        <div className="mt-8 flex justify-between border-t border-amber-100 pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetSettings}
                                disabled={saving}
                                className="border-amber-300 text-amber-700 hover:bg-amber-50"
                            >
                                {saving ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                Reset to Defaults
                            </Button>

                            <Button
                                type="submit"
                                disabled={saving}
                                className="bg-amber-600 text-white hover:bg-amber-700"
                            >
                                {saving ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                Save Settings
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}